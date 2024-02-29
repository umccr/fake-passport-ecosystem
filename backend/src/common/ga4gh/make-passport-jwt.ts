import { importJWK, SignJWT } from "jose";
import cryptoRandomString from "crypto-random-string";
import { AnyJose } from "../crypto/jose-keys/any-jose";
import { isArray, isString } from "lodash";

/**
 * Make a JWT string representing a GA4GH passport.
 *
 * @param keyPrivateJose the private key used for signing
 * @param issuer the issuer of the passport
 * @param kid the identifier for the private key
 * @param subjectId the subject of the passport
 * @param visas the (already encoded) visas for the passport
 * @param forServers if present, the servers (aud) for the passport to be bound to
 */
export async function makePassportJwt(
  keyPrivateJose: AnyJose,
  issuer: string,
  kid: string,
  subjectId: string,
  visas: string[],
  forServers?: string[],
): Promise<string> {
  if (keyPrivateJose.kty !== "RSA")
    throw Error("JWT passports only currently support RSA");

  // note: it is ok for the visas to be an empty array - but they must be an array of strings so the JSON
  // in the JWT is conformant

  if (!isArray(visas))
    throw Error("The visas for the passport must be an array of strings");

  for (const s of visas) {
    if (!isString(s))
      throw Error("The visas for the passport must be an array of strings");
  }

  // to make a private key directly usable by the JWT signer - we convert
  // our key into this private JWK structure and then parse it
  const rsaPrivateKey = await importJWK({
    alg: keyPrivateJose.alg,
    kty: keyPrivateJose.kty,
    e: keyPrivateJose.e,
    n: keyPrivateJose.n,
    d: keyPrivateJose.dBase64Url,
    p: keyPrivateJose.pBase64Url,
    q: keyPrivateJose.qBase64Url,
    dp: keyPrivateJose.dpBase64Url,
    dq: keyPrivateJose.dqBase64Url,
    qi: keyPrivateJose.qiBase64Url,
  });

  const newJwtSigner = new SignJWT({ ga4gh_passport_v1: visas });

  newJwtSigner
    .setProtectedHeader({
      alg: keyPrivateJose.alg!,
      typ: "vnd.ga4gh.passport+jwt",
      kid: kid,
    })
    .setSubject(subjectId)
    .setIssuedAt()
    .setIssuer(issuer)
    .setExpirationTime("1hr")
    .setJti(cryptoRandomString({ length: 16, type: "alphanumeric" }));

  if (forServers && forServers.length > 0) newJwtSigner.setAudience(forServers);

  const jwtPassport = await newJwtSigner.sign(rsaPrivateKey);

  console.log(
    `Generated JWT passport that had length in characters of ${jwtPassport.length}`,
  );

  return jwtPassport;
}
