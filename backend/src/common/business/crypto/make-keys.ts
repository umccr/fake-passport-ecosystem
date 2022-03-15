import nodeForge from 'node-forge';
import base64url from 'base64url';
import { JWK } from "oidc-provider";

/**
 * Creates a JWK for a server that includes the private key details.
 * This JWK can then be used directly by the NodeJS OIDC provider.
 */
export async function makePrivateRsaJwk(): Promise<JWK> {

  // make a promise based wrapper for the RSA keygenerator..
  const makeKey = () => {
    return new Promise((resolve, reject) => {
      nodeForge.pki.rsa.generateKeyPair({ bits: 2048, workers: 2 }, (err, keypair) => {
        if (err) reject(err);

        resolve(keypair);
      });
    });
  };

  const rsaKey: any = await makeKey();
  const jwksKey: JWK = {
    d: base64url(Buffer.from(rsaKey.privateKey.d.toByteArray())),
    dp: base64url(Buffer.from(rsaKey.privateKey.dP.toByteArray())),
    dq: base64url(Buffer.from(rsaKey.privateKey.dQ.toByteArray())),
    e: base64url(Buffer.from(rsaKey.privateKey.e.toByteArray())),
    kty: 'RSA',
    n: base64url(Buffer.from(rsaKey.privateKey.n.toByteArray())),
    p: base64url(Buffer.from(rsaKey.privateKey.p.toByteArray())),
    q: base64url(Buffer.from(rsaKey.privateKey.q.toByteArray())),
    qi: base64url(Buffer.from(rsaKey.privateKey.qInv.toByteArray())),
    use: 'sig',
  };

  return jwksKey;
}
