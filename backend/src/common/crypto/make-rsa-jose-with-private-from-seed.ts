import nodeForge from "node-forge";
import base64url from "base64url";
import { AnyJose } from "./jose-keys/any-jose";

export async function makeRsaJoseWithPrivateFromSeed(
  seedChar?: string,
): Promise<AnyJose> {
  // we make a custom PRNG
  const prng = nodeForge.random.createInstance();

  // for the case where we are given a seed - we want the PRNG to in fact
  // not really return random data
  if (seedChar) {
    if (seedChar.length !== 1)
      throw new Error(
        "The setup for our not so random PRNG needs one and only one character",
      );

    // we make a new PRNG that we will be less than random!
    prng.seedFileSync = function (needed) {
      return nodeForge.util.fillString(seedChar, needed);
    };
  }

  const rsaKey = await new Promise<nodeForge.pki.rsa.KeyPair>(
    (resolve, reject) => {
      nodeForge.pki.rsa.generateKeyPair(
        { bits: 2048, workers: -1, prng: prng },
        (err, keypair) => {
          if (err) reject(err);

          resolve(keypair);
        },
      );
    },
  );

  return {
    kty: "RSA",
    alg: "RS256",
    e: base64url(Buffer.from(rsaKey.privateKey.e.toByteArray())),
    n: base64url(Buffer.from(rsaKey.privateKey.n.toByteArray())),
    dBase64Url: base64url(Buffer.from(rsaKey.privateKey.d.toByteArray())),
    dpBase64Url: base64url(Buffer.from(rsaKey.privateKey.dP.toByteArray())),
    dqBase64Url: base64url(Buffer.from(rsaKey.privateKey.dQ.toByteArray())),
    pBase64Url: base64url(Buffer.from(rsaKey.privateKey.p.toByteArray())),
    qBase64Url: base64url(Buffer.from(rsaKey.privateKey.q.toByteArray())),
    qiBase64Url: base64url(Buffer.from(rsaKey.privateKey.qInv.toByteArray())),
  };
}
