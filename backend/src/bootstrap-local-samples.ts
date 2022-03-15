import { FixturePayload } from './common/business/fixture-payload';

/**
 * In case we need to simulate API gateway events - this is a saved 2.0 gw event for initiating a flow
 */
export const sampleApiEvent: any = {
  version: '2.0',
  routeKey: '$default',
  rawPath: '/oidc/auth',
  rawQueryString: 'response_type=code&client_id=abcd&redirect_uri=http%3A%2F%2Flocalhost%3A8888%2Fcallback&scope=openid+ga4gh&state=aaaa',
  headers: {
    accept: '*/*',
    'accept-encoding': 'gzip, deflate',
    'content-length': '0',
    host: 'abcde.aai.nagim.dev',
    'user-agent': 'python-requests/2.27.1',
    'x-amzn-trace-id': 'Root=1-61ef8d7d-2bce0f3561e95e8b42737c82',
    'x-forwarded-for': '1.2.3.4',
    'x-forwarded-port': '443',
    'x-forwarded-proto': 'https',
  },
  requestContext: {
    accountId: '843407916570',
    apiId: '32j3j3ifj5',
    domainName: 'abcde.aai.nagim.dev',
    domainPrefix: 'abcde',
    http: {
      method: 'GET',
      path: '/oidc/auth',
      protocol: 'HTTP/1.1',
      sourceIp: '220.240.197.193',
      userAgent: 'python-requests/2.27.1',
    },
    requestId: 'MfMLpirZSwMEMYQ=',
    routeKey: '$default',
    stage: '$default',
    time: '25/Jan/2022:05:41:17 +0000',
    timeEpoch: 1643089277591,
  },
  queryStringParameters: {
    client_id: 'abcd',
    redirect_uri: 'http://localhost:8888/callback',
    response_type: 'code',
    scope: 'openid ga4gh',
    state: 'aaaa',
  },
  isBase64Encoded: false,
};
