import serverlessExpress from "@vendia/serverless-express";
import { getMandatoryEnv } from "./common/app-env";
import { AppVisaIssuerEga } from "./app-visa-issuer/demo-issuers/app-visa-issuer-ega";
import { AppVisaIssuerAhpra } from "./app-visa-issuer/demo-issuers/app-visa-issuer-ahpra";
import { BrokerEurope } from "./app-broker/demo-brokers/broker-europe";
import { BrokerAustralia } from "./app-broker/demo-brokers/broker-australia";
import { BrokerUsa } from "./app-broker/demo-brokers/broker-usa";

///
/// THE LAMBDA ENTRY POINT - THIS NEEDS TO SETUP/CACHE THE CORRECT
/// EXPRESS SERVER DEPENDING ON THE URL
///

/**
 * Whilst the prefix of our URL is dynamic - the ending of the domain
 * is fixed and set by the outer environment variables.
 */
const domainName = getMandatoryEnv("DOMAIN_NAME");

/**
 * Statically define all the brokers and visa issuers.
 *
 * NOTE: the definitions of which broker maps to which visa issuer is
 * unfortunately duplicated in bootstrap-local. So if you make changes
 * here also make changes there.
 */
const appVisaIssuerEga = new AppVisaIssuerEga(domainName);
const appVisaIssuerAhpra = new AppVisaIssuerAhpra(domainName);

const appBrokerEurope = new BrokerEurope(domainName, [
  appVisaIssuerEga,
  appVisaIssuerAhpra,
]);
const appBrokerAustralia = new BrokerAustralia(domainName, [
  appVisaIssuerAhpra,
]);
const appBrokerUsa = new BrokerUsa(domainName, [appVisaIssuerAhpra]);

/**
 * A JSON.stringify replacer() implementation - we print some useful
 * debug info of our input/output from the Lambda - but
 * we make sure any individual string field is truncated if too long.
 *
 * @param key
 * @param value
 */
const shorterStringReplacer = (key: string, value: any): string => {
  if (typeof value === 'string' || value instanceof  String) {
    if (value.length > 256) return value.substring(0, 256) + '... truncated ...';
  }
  return value;
};

/**
 * Our lambda is the entrypoint for a variety of Express web servers - all potentially
 * constructed dynamically (i.e. we are not sitting on a fixed domain name and the
 * functionality we serve up depends on the URL).
 *
 * @param ev
 * @param context
 */
export const handler = async (ev: any, context: any) => {
  //
  // BEWARE - THIS ENTRYPOINT IS EXPOSED TO THE INTERNET (i.e. the internet can craft incoming
  // HTTP requests saying anything) - SO WE CHECK AND DOUBLE-CHECK THE VALIDITY OF ALL INFORMATION
  //

  // if coming into endpoint "https://abcd.aai.host.org", the domain prefix is "abcd" - and is the selector we use to
  // identify which Express instance to use
  const domainPrefix: string = ev?.requestContext?.domainPrefix || "";

  // we know the domain prefix names we are going to create are all in this regex range - so we can be super
  // tight on insuring the inputs match
  // this is probably overkill but stops any funny business from the domain names upfront

  // at least 1 leading letter
  // then letters/numbers and any special chars we are happy to accept ('-' etc)
  const domainWhitelistMatch = domainPrefix.match(/^[a-zA-Z][a-zA-Z0-9\-]*$/);

  // abort out if domain feels funny
  if (!domainPrefix || !domainWhitelistMatch) {
    return {
      statusCode: 404,
      multiValueHeaders: {},
      body: "",
      isBase64Encoded: false,
    };
  }

  const allApps = [
    appBrokerAustralia,
    appBrokerEurope,
    appBrokerUsa,
    appVisaIssuerEga,
    appVisaIssuerAhpra,
  ];

  for (const a of allApps) {
    if (a.getId() === domainPrefix) {
      const serverlessExpressInstance = serverlessExpress({
        app: a.getServer(),
      });

      console.log(
        `Lambda Request for ${domainPrefix} - `,
        JSON.stringify(ev, shorterStringReplacer),
      );
      const res = await serverlessExpressInstance(ev, context);
      console.log(
        "Lambda Response - ",
        JSON.stringify(res, shorterStringReplacer),
      );
      return res;
    }
  }

  // if we fall through to here then we didn't recognise the domain prefix
  return {
    statusCode: 404,
    multiValueHeaders: {},
    body: "",
    isBase64Encoded: false,
  };
};
