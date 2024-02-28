import forge from "node-forge";
import base64url from "base64url";
import { add, getUnixTime } from "date-fns";
import { importJWK, SignJWT } from "jose";
import cryptoRandomString from "crypto-random-string";
import { AnyJose } from "./jose-keys/any-jose";
import { RsaJose } from "./jose-keys/rsa-jose";

/**
 * Create a compact visa with visa content, a key identifier - and signed by the corresponding key from the passed
 * in key set.
 *
 * @param keys the definitions of all the keys (kid -> hex string of Ed25519 seed)
 * @param issuer the (optional) issuer of the visa
 * @param kid the selected kid to use for signing
 * @param subjectId the subject of the visa (should match the subject of the passport this goes into or it will be rejected by clearing house)
 * @param duration the duration for the visa as a date-fns duration
 * @param visaAssertions a list of visa assertions "k:v" (should not include those mandatory assertions)
 */
export function makeCompactVisaSigned(
  keys: { [kid: string]: AnyJose },
  issuer: string | null,
  kid: string,
  subjectId: string,
  duration: Duration,
  visaAssertions: string[],
): any {
  const keyPrivateJose = keys[kid];

  if (!keyPrivateJose)
    throw Error(`Cant make a visa with the unknown kid ${kid}`);

  if (keyPrivateJose.kty === "OKP") {
    // TODO: should check none of our mandatory assertions are in already

    // construct the actual visa string to sign from the list of assertions
    // we clone the input array as we are going to sort it in place
    const startingAssertions = Array.from(visaAssertions);

    // make sure we don't accidentally use the input assertions array any more
    visaAssertions = [];

    const expiryDate = add(new Date(), duration);
    const visaJti = cryptoRandomString({ length: 16, type: "alphanumeric" });

    startingAssertions.push(
      `et:${getUnixTime(expiryDate)}`,
      `iu:${subjectId}`,
      `iv:${visaJti}`,
    );
    startingAssertions.sort();

    const visaContent = startingAssertions.join(" ");

    const seed = forge.util.hexToBytes(keyPrivateJose.dHex!);

    if (seed.length != 32)
      throw Error(
        `Private keys (seed) for ED25519 must be exactly 32 octets but for kid ${kid} was ${seed.length}`,
      );

    const keypair = forge.pki.ed25519.generateKeyPair({ seed: seed });
    const msgBuffer = Buffer.from(visaContent, "utf8");

    const signature = forge.pki.ed25519.sign({
      message: msgBuffer,
      privateKey: keypair.privateKey,
    });

    const visa = {
      v: visaContent,
      k: kid,
      s: base64url(Buffer.from(signature)),
      i: "",
    };

    if (issuer) visa.i = issuer;

    console.log(
      `Generated compact visa that had length in characters of ${
        JSON.stringify(visa).length
      }`,
    );

    return visa;
  } else {
    throw Error("Compact visas only currently support OKP ED25519");
  }
}
