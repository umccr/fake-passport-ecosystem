import { AppBroker } from './app-broker/app-broker';
import NodeCache from 'node-cache';
import serverlessExpress from '@vendia/serverless-express';
import { DynamoDBAdapter } from './common/business/db/oidc-provider-dynamodb-adapter';
import { AppControl } from './app-control/app-control';

const appCache = new NodeCache({ useClones: false, checkperiod: 0, stdTTL: 0, maxKeys: 1000 });

const shorterStringReplacer = (key: string, value: string): string => {
  if (typeof value === 'string') {
    if (value.length > 256) return value.substr(0, 256) + '... truncated ...';
  }
  return value;
};

/**
 * Our lambda is the entrypoint for a variety of Express web servers - all potentially
 * constructed dynamically (i.e not fixed domain names).
 *
 * @param ev
 * @param context
 */
export const handler = async (ev: any, context: any) => {
  //
  // BEWARE - THIS ENTRYPOINT IS EXPOSED TO THE INTERNET (i.e the internet can craft incoming
  // HTTP requests saying anything) - SO WE CHECK AND DOUBLE CHECK THE VALIDITY OF ALL INFORMATION
  //

  // if coming into endpoint "https://abcd.aai.host.org", the prefix is "abcd" - and is the selector we use to
  // identify which Express instance to use
  const domainPrefix: string = ev?.requestContext?.domainPrefix || '';

  // we know the dynamic domain names we are going to create are all in this regex range - so we can be super
  // tight on insuring the inputs match
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

    const adapter = new DynamoDBAdapter('Fixture');

    const fixturePayload = await adapter.findFixture(domainPrefix);

    if (!fixturePayload) {
      console.log(`Lambda Request no record found for ${domainPrefix} - `, JSON.stringify(ev, shorterStringReplacer));
      return {
        statusCode: 404,
        multiValueHeaders: {},
        body: '',
        isBase64Encoded: false,
      };
    }

    const newApp = new AppBroker(domainPrefix, fixturePayload);

    appCache.set(domainPrefix, newApp);
  }

  const app: AppBroker = appCache.get(domainPrefix)!;

  const serverlessExpressInstance = serverlessExpress({ app: app.getServer() });

  console.log(`Lambda Request ${cacheMiss ? 'cache-miss' : 'cache-hit'} for ${domainPrefix} - `, JSON.stringify(ev, shorterStringReplacer));
  const res = await serverlessExpressInstance(ev, context);
  console.log('Lambda Response - ', JSON.stringify(res, shorterStringReplacer));
  return res;
};
