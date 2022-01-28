// I know there are probably definitions of this is real JWT libraries but for our purposes
// I am just making some simple definitions just for the ones we are supporting for the moment
export type EdDsaJose = {
  // this is the definition we are expecting to see for our keys in 'secret' store
  kty: 'OKP';
  crv: 'Ed25519' | 'Ed448';
  // we could have chosen a bunch of formats here - ended up going with plain hex encoded string
  // (as often that is the format used inside RFC example test data)
  dHex?: string;

  // this is the extra fields we will be adding for exposing via JWKS (and obviously *not* exposing the dHex private key)
  x?: string;
  kid?: string;
  alg?: string;
};
