import { JWKS } from "oidc-provider";
import { ScenarioData } from "./scenario/scenario-data";
import { DynamoDBAdapter } from "./db/oidc-provider-dynamodb-adapter";
import { getScenario } from "./scenario/scenario";

/**
 * The mechanism by which we should fetch fixture data. Note that we do
 * something slightly naughty - basically we don't want to persist the
 * complete ScenarioData into the dynamo backend (due to it being
 * essentially immutable and *possibly* useful as a real class) - so
 * we persist a scenario id and 'fix' it here.
 *
 * @param fixtureId
 */
export async function getFixture(fixtureId: string): Promise<FixturePayload> {

  const fixture = await new DynamoDBAdapter('Fixture').findFixture(fixtureId);

  if (!fixture)
    throw new Error(`Failed to find fixture corresponding to id ${fixtureId}`);

  // turn our scenario id into a much more useful scenario object
  fixture.scenario = getScenario(fixture.scenarioId);

  return fixture;
}

/**
 * The fixture payload contains all the configuration that defines the initial
 * state and behaviour of the broker.
 */
export interface FixturePayload {
  scenarioId: string,

  scenario?: ScenarioData,

  loginStage: LoginStage;

  consentStage: ConsentStage

  providerRaw: OidcProviderRaw;
}

/**
 * The sections of the OIDC provider config that we are just going to copy verbatim
 * from dynamo into the config. This limits it to those config settings that are purely
 * data (i.e. we can't represent async ()=>{ } in the db, only strings, arrays etc.
 */
interface OidcProviderRaw {
  // the clients section of the OIDC provider config
  clients: any;

  // the cookies section of the OIDC provider config
  cookies: any;

  // the JWKS section of the OIDC provider config
  jwks: JWKS;
}



export interface LoginStage {
  // if not null, is the subject id of the user from the fixture scenario that should be auto logged in
  // if null, the OIDC flow should display the set of users from the fixture scenario
  forceSubject: string | null;
}

export interface ConsentStage {
  forceAccept: boolean;
}

