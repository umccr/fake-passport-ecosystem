import { BrokerPayload } from './business/db/broker-payload';

export const broker1: BrokerPayload = {
  providerRaw: {
    clients: [
      {
        client_id: 'abcd',
        client_secret: 'xyzz',
        redirect_uris: ['http://localhost:8888/callback'],
      },
    ],
    cookies: { keys: ['asdad'] },
    jwks: {
      keys: [
        {
          d: 'VEZOsY07JTFzGTqv6cC2Y32vsfChind2I_TTuvV225_-0zrSej3XLRg8iE_u0-3GSgiGi4WImmTwmEgLo4Qp3uEcxCYbt4NMJC7fwT2i3dfRZjtZ4yJwFl0SIj8TgfQ8ptwZbFZUlcHGXZIr4nL8GXyQT0CK8wy4COfmymHrrUoyfZA154ql_OsoiupSUCRcKVvZj2JHL2KILsq_sh_l7g2dqAN8D7jYfJ58MkqlknBMa2-zi5I0-1JUOwztVNml_zGrp27UbEU60RqV3GHjoqwI6m01U7K0a8Q_SQAKYGqgepbAYOA-P4_TLl5KC4-WWBZu_rVfwgSENwWNEhw8oQ',
          dp: 'E1Y-SN4bQqX7kP-bNgZ_gEv-pixJ5F_EGocHKfS56jtzRqQdTurrk4jIVpI-ZITA88lWAHxjD-OaoJUh9Jupd_lwD5Si80PyVxOMI2xaGQiF0lbKJfD38Sh8frRpgelZVaK_gm834B6SLfxKdNsP04DsJqGKktODF_fZeaGFPH0',
          dq: 'F90JPxevQYOlAgEH0TUt1-3_hyxY6cfPRU2HQBaahyWrtCWpaOzenKZnvGFZdg-BuLVKjCchq3G_70OLE-XDP_ol0UTJmDTT-WyuJQdEMpt_WFF9yJGoeIu8yohfeLatU-67ukjghJ0s9CBzNE_LrGEV6Cup3FXywpSYZAV3iqc',
          e: 'AQAB',
          kty: 'RSA',
          n: 'xwQ72P9z9OYshiQ-ntDYaPnnfwG6u9JAdLMZ5o0dmjlcyrvwQRdoFIKPnO65Q8mh6F_LDSxjxa2Yzo_wdjhbPZLjfUJXgCzm54cClXzT5twzo7lzoAfaJlkTsoZc2HFWqmcri0BuzmTFLZx2Q7wYBm0pXHmQKF0V-C1O6NWfd4mfBhbM-I1tHYSpAMgarSm22WDMDx-WWI7TEzy2QhaBVaENW9BKaKkJklocAZCxk18WhR0fckIGiWiSM5FcU1PY2jfGsTmX505Ub7P5Dz75Ygqrutd5tFrcqyPAtPTFDk8X1InxkkUwpP3nFU5o50DGhwQolGYKPGtQ-ZtmbOfcWQ',
          p: '5wC6nY6Ev5FqcLPCqn9fC6R9KUuBej6NaAVOKW7GXiOJAq2WrileGKfMc9kIny20zW3uWkRLm-O-3Yzze1zFpxmqvsvCxZ5ERVZ6leiNXSu3tez71ZZwp0O9gys4knjrI-9w46l_vFuRtjL6XEeFfHEZFaNJpz-lcnb3w0okrbM',
          q: '3I1qeEDslZFB8iNfpKAdWtz_Wzm6-jayT_V6aIvhvMj5mnU-Xpj75zLPQSGa9wunMlOoZW9w1wDO1FVuDhwzeOJaTm-Ds0MezeC4U6nVGyyDHb4CUA3ml2tzt4yLrqGYMT7XbADSvuWYADHw79OFjEi4T3s3tJymhaBvy1ulv8M',
          qi: 'wSbXte9PcPtr788e713KHQ4waE26CzoXx-JNOgN0iqJMN6C4_XJEX-cSvCZDf4rh7xpXN6SGLVd5ibIyDJi7bbi5EQ5AXjazPbLBjRthcGXsIuZ3AtQyR0CEWNSdM7EyM5TRdyZQ9kftfz9nI03guW3iKKASETqX2vh0Z8XRjyU',
          use: 'sig',
        },
      ],
    },
  },
};

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
