import forge from "node-forge";
import base64url from "base64url";
import { AnyJose } from "./jose-keys/any-jose";
import { JWK, JWKS } from "oidc-provider";

/**
 * The OIDC provider uses this JWKS for creating JWTs and other
 * crypto. It handles the serving of OpenID configurations and
 * JWKS data for OIDC discovery. It for instance will obviously
 * strip out the private keys from any keys it exposes to the
 * web.
 *
 * @param keys
 */
export function makeJwksForOidcProvider(keys: {
  [kid: string]: AnyJose;
}): JWKS {
  const results: JWK[] = [];

  for (const [kid, keyPrivateJose] of Object.entries(keys)) {
    if (keyPrivateJose.kty === "RSA") {
      // a simple (and incomplete) test to make sure we are being passed in keys that have
      // private signing values
      if (!keyPrivateJose.dBase64Url)
        throw Error(
          "Private key for RSA must be specified as a base 64 url string in the dBase64Url field",
        );

      results.push({
        kty: keyPrivateJose.kty,
        kid: kid,
        alg: keyPrivateJose.alg,
        n: keyPrivateJose.n,
        e: keyPrivateJose.e,
        d: keyPrivateJose.dBase64Url,
        dp: keyPrivateJose.dpBase64Url,
        dq: keyPrivateJose.dqBase64Url,
        q: keyPrivateJose.qBase64Url,
        qi: keyPrivateJose.qiBase64Url,
        p: keyPrivateJose.pBase64Url,
      });

      continue;
    }

    throw new Error(`Unsupported kty of ${keyPrivateJose.kty}`);
  }

  return {
    keys: results,
  };
}

/**
 * From a given set of keys (including the private key data) - make the equivalent (non-private)
 * JWKS file we would expose at a JWKS endpoint. This is used when we want to expose
 * our own JWKS info on the web - but we are *not* using the OIDC provider.
 *
 * @param keys dictionary of kid to private key structure
 */
export function makeJwks(keys: { [kid: string]: AnyJose }): JWKS {
  const results: AnyJose[] = [];

  for (const [kid, keyPrivateJose] of Object.entries(keys)) {
    if (keyPrivateJose.kty === "RSA") {
      if (!keyPrivateJose.dBase64Url)
        throw Error(
          "Private key for RSA must be specified as a base 64 url string in the dBase64Url field",
        );

      results.push({
        kty: keyPrivateJose.kty,
        kid: kid,
        alg: "RS256",
        n: keyPrivateJose.n,
        e: keyPrivateJose.e,
      });

      continue;
    }

    // the format of this for ED25519 etc is
    // https://datatracker.ietf.org/doc/html/rfc8037
    // CFRG Elliptic Curve Diffie-Hellman (ECDH) and Signatures in JSON Object Signing and Encryption (JOSE)
    if (keyPrivateJose.kty === "OKP") {
      if (!keyPrivateJose.dHex)
        throw Error(
          "Private key (seed) for ED25519|ED448 must be specified as a hex string in the dHex field",
        );

      if (keyPrivateJose.crv === "Ed25519") {
        const seed = forge.util.hexToBytes(keyPrivateJose.dHex);

        if (seed.length != 32)
          throw Error(
            `Private keys (seed) for ED25519 must be exactly 32 octets but for kid ${kid} was ${seed.length}`,
          );

        const keypair = forge.pki.ed25519.generateKeyPair({ seed: seed });

        results.push({
          kty: keyPrivateJose.kty,
          crv: keyPrivateJose.crv,
          kid: kid,
          alg: "EdDSA",
          x: base64url(Buffer.from(keypair.publicKey)),
        });
      }

      if (keyPrivateJose.crv === "Ed448") {
        throw Error("Not implemented in node-forge yet");

        /* const seed = forge.util.hexToBytes(keyPrivateJose.dHex);

                if (seed.length != 48)
                    throw Error(`Private keys (seed) for ED448 must be exactly 32 octets but for kid ${kid} was ${seed.length}`);

                const keypair = forge.pki.ed448.generateKeyPair({seed: seed});

                results.push({
                    "kty": keyPrivateJose.kty,
                    "crv": keyPrivateJose.crv,
                    "kid": kid,
                    "alg": "EdDSA",
                    "x": base64url(Buffer.from(keypair.publicKey))
                }); */
      }
    }
  }

  return {
    keys: results,
  };
}
