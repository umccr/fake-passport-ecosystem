import { JWKS } from 'oidc-provider';

/**
 * The sections of the OIDC provider config that we are just going to copy verbatim
 * from dynamo into the config. This limits it to those config settings that are purely
 * data (i.e. we can't represent async ()=>{ } in the db, only strings, arrays etc.
 */
interface BrokerProviderRaw {
  // the clients section of the OIDC provider config
  clients: any;

  // the cookies section of the OIDC provider config
  cookies: any;

  // the JWKS section of the OIDC provider config
  jwks: JWKS;
}

export interface BrokerPayload {
  providerRaw: BrokerProviderRaw;
}
