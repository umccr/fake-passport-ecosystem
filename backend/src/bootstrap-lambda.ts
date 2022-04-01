import serverlessExpress from '@vendia/serverless-express';
import NodeCache from 'node-cache';
import { AppBroker } from './app-broker/app-broker';
import { AppControl } from './app-control/app-control';
import { getFixture } from './common/business/fixture-payload';
import { getMandatoryEnv } from './common/app-env';

///
/// THE LAMBDA ENTRY POINT - THIS NEEDS TO SETUP/CACHE THE CORRECT
/// EXPRESS SERVER DEPENDING ON THE URL
///

/**
 * Whilst the prefix of our URL is dynamic - the ending of the domain
 * is fixed and set by the outer environment variables.
 */
const domainName = getMandatoryEnv('DOMAIN_NAME');

/**
 * This NodeCache is retained between Lambda calls and stores Express instances
 * for a given DNS name. This cache has a limited lifetime because the
 * lambda itself will eventually (1hr?) be recycled. But it gives us some
 * benefit when there is lots of activity across a small set of DNS names
 */
const appCache = new NodeCache({
  useClones: false,
  // we set up to cache express instances for the lifetime of the lambda
  checkperiod: 0,
  stdTTL: 0,
  // I suppose there is some sort of DOS attack that might involve sending
  // us loads of traffic across a variety of DNS endpoints - and we might hit
  // this - though I think 'failing' at that point is probably a good result -
  // but we possibly should revisit this number/technique
  maxKeys: 1000,
});

/**
 * A JSON.stringify replacer() implementation - we print some useful
 * debug info of our input/output from the Lambda - but
 * we make sure any individual string field is truncated if too long.
 *
 * @param key
 * @param value
 */
const shorterStringReplacer = (key: string, value: string): string => {
  if (typeof value === 'string') {
    if (value.length > 256) return value.substr(0, 256) + '... truncated ...';
  }
  return value;
};

/**
 * Our lambda is the entrypoint for a variety of Express web servers - all potentially
 * constructed dynamically (i.e. we are not sitting on a fixed domain name and the
 * functionality we serve up depends on the name).
 *
 * @param ev
 * @param context
 */
export const handler = async (ev: any, context: any) => {
  //
  // BEWARE - THIS ENTRYPOINT IS EXPOSED TO THE INTERNET (i.e. the internet can craft incoming
  // HTTP requests saying anything) - SO WE CHECK AND DOUBLE-CHECK THE VALIDITY OF ALL INFORMATION
  //

  // if coming into endpoint "https://abcd.aai.host.org", the prefix is "abcd" - and is the selector we use to
  // identify which Express instance to use
  const domainPrefix: string = ev?.requestContext?.domainPrefix || '';

  // we know the dynamic domain prefix names we are going to create are all in this regex range - so we can be super
  // tight on insuring the inputs match

  // at least 1 leading letter
  // then letters/numbers and any special chars we are happy to accept ('-' etc)
  const domainWhitelistMatch = domainPrefix.match(/^[a-zA-Z][a-zA-Z0-9\-]*$/);

  // abort out if domain feels funny
  if (!domainPrefix || !domainWhitelistMatch) {
    return {
      statusCode: 404,
      multiValueHeaders: {},
      body: '',
      isBase64Encoded: false,
    };
  }

  if (domainPrefix.startsWith('broker-')) {
  }

  // we have a special known control endpoint - which is in fact an entirely different api
  if (domainPrefix === 'control') {
    const app = new AppControl();
    const serverlessExpressInstance = serverlessExpress({ app: app.getServer() });

    console.log(`Lambda (Control) Request -`, JSON.stringify(ev, shorterStringReplacer));
    const res = await serverlessExpressInstance(ev, context);
    console.log('Lambda (Control) Response - ', JSON.stringify(res, shorterStringReplacer));
    return res;
  }

  // just a debug variable so we can see how often we are cache hitting
  let cacheMiss = false;

  // if we have not seen this domain prefix in this lambda before then lets make an Express instance for it
  if (!appCache.has(domainPrefix)) {
    cacheMiss = true;

    const fixturePayload = await getFixture(domainPrefix);

    if (!fixturePayload) {
      console.log(`Lambda Request no record found for ${domainPrefix} - `, JSON.stringify(ev, shorterStringReplacer));
      return {
        statusCode: 404,
        multiValueHeaders: {},
        body: '',
        isBase64Encoded: false,
      };
    }

    const newApp = new AppBroker(domainPrefix, domainName, fixturePayload);

    appCache.set(domainPrefix, newApp);
  }

  const app: AppBroker = appCache.get(domainPrefix)!;

  const serverlessExpressInstance = serverlessExpress({ app: app.getServer() });

  console.log(`Lambda Request ${cacheMiss ? 'cache-miss' : 'cache-hit'} for ${domainPrefix} - `, JSON.stringify(ev, shorterStringReplacer));
  const res = await serverlessExpressInstance(ev, context);
  console.log('Lambda Response - ', JSON.stringify(res, shorterStringReplacer));
  return res;
};
