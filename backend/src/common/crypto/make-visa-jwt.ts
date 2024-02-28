import { importJWK, SignJWT } from "jose";
import cryptoRandomString from "crypto-random-string";
import { AnyJose } from "./jose-keys/any-jose";

/**
 * Make a JWT string representing a GA4GH visa.
 *
 * @param keyPrivateJose
 * @param issuer
 * @param kid
 * @param subjectId
 * @param claims
 */
export async function makeVisaJwt(
  keyPrivateJose: AnyJose,
  issuer: string | null,
  kid: string,
  subjectId: string,
  claims: any,
): Promise<string> {
  if (keyPrivateJose.kty !== "RSA")
    throw Error("JWT visas only currently support RSA");

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

  const newJwtSigner = new SignJWT(claims);

  newJwtSigner
    .setProtectedHeader({ alg: keyPrivateJose.alg!, typ: "JWT", kid: kid })
    .setSubject(subjectId)
    .setIssuedAt()
    .setIssuer(issuer!)
    .setExpirationTime("365d")
    .setJti(cryptoRandomString({ length: 16, type: "alphanumeric" }));

  const jwtVisa = await newJwtSigner.sign(rsaPrivateKey);

  console.log(
    `Generated JWT visa that had length in characters of ${jwtVisa.length}`,
  );

  return jwtVisa;
}
