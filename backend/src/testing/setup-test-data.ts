import cryptoRandomString from 'crypto-random-string';
import { makePrivateRsaJwk } from '../common/business/crypto/make-keys';
import { DynamoDBAdapter } from '../common/business/db/oidc-provider-dynamodb-adapter';
import { DynamoDBClient, ScanCommand, ScanInput } from '@aws-sdk/client-dynamodb';
import { getMandatoryEnv } from '../common/app-env';
import { DeleteCommand } from '@aws-sdk/lib-dynamodb';

const dbClient = new DynamoDBClient({region: 'ap-southeast-2', endpoint: 'http://localhost:8000'});

/**
 * Gets all the data from a (presumably small) test table in anticipation of deleting it all.
 *
 * @param table
 */
const getAllRecords = async (table: string) => {
  if (!table.toLocaleLowerCase().includes('aai') && !table.toLocaleLowerCase().includes('local'))
    throw Error("I'm not prepared to nuke all the data from a table unless it contains the string 'AAI' and 'Local' in its name");

  let items: any[] = [];
  let data = await dbClient.send(
    new ScanCommand({
      TableName: table,
    }),
  );

  if (data.Items) items.push(...data.Items);

  while (typeof data.LastEvaluatedKey != 'undefined') {
    const startKey = data.LastEvaluatedKey;
    data = await dbClient.send(
      new ScanCommand({
        TableName: table,
        ExclusiveStartKey: startKey,
      }),
    );
    if (data.Items) items.push(...data.Items);
  }
  return items;
};

/**
 * A staticly generated RSA key - we are totally happy with this being checked in public source - it
 * should never be used in anything other than local testing and will never be trusted by anything
 */
const staticJwks = {
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
};

const safeCharacterSet = 'bcdfghjkmnpqrstvwyz';

/**
 * Sets up a single dynamic test case and return the 'id' for this broker we have set up.
 * This is simulating the deployment story where each fixture can result in a broker
 *   https://<id>.passport-test.com
 * For local dev of course, we cannot make new DNS names, but we still act as if one has
 * been made and the name is passed into our server.
 */
export async function setupTestData(): Promise<string> {
  const tableName = getMandatoryEnv('TABLE_NAME');

  const allRecords = await getAllRecords(tableName);

  for (const item of allRecords) {
    await dbClient.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { modelId: item.modelId.S },
      }),
    );
  }

  // you can choose to want static data if the calling code is primitive - dynamic data is a better test of
  // the system though
  const staticTestData = true;

  const id = staticTestData ? 'static' : cryptoRandomString({ length: 16, characters: safeCharacterSet });
  const jwksKey = staticTestData ? staticJwks : await makePrivateRsaJwk();
  const clientId = staticTestData ? 'client' : cryptoRandomString({ length: 16, characters: safeCharacterSet });
  const clientSecret = staticTestData ? 'secret' : cryptoRandomString({ length: 16, characters: safeCharacterSet });

  // make a db record for the fixture
  await new DynamoDBAdapter('Fixture').createFixture(
    id,
    {
      scenarioId: 'error',
      providerRaw: {
        clients: [
          {
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uris: ['http://localhost:8888/callback'],
          },
        ],
        jwks: { keys: [jwksKey] },
        cookies: {
          keys: [cryptoRandomString({ length: 16, type: 'url-safe' })],
        },
      },
      loginStage: {
        forceSubject: null
        // forceSubject: 'http://uid.org/123'
      },
      consentStage: {
        forceAccept: true
      },
      introduceErrors: {
        expiredPassport: false,
        expiredVisa: true,
        invalidJwtAlgorithm: false,
        invalidPassportSignature: false,
        invalidVisaSignature: true
      }
    },
    3600,
  );

  return id;
}
