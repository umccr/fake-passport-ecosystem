import {JWTHeaderParameters, KeyLike, SignJWT} from "jose";
import cryptoRandomString                      from "crypto-random-string";

/**
 * Function to generate a signed JWT
 * @param claims
 * @param protectedHeader
 * @param subjectId
 * @param issuer
 * @param expirationTime
 * @param rsaPrivateKey
 */
export async function generateSignedJWT(claims: any, protectedHeader: JWTHeaderParameters
    , subjectId: string, issuer: string | null, expirationTime: string, rsaPrivateKey: KeyLike | Uint8Array) {
    const newJwtSigner = new SignJWT(claims);
    newJwtSigner
        .setProtectedHeader(protectedHeader)
        .setSubject(subjectId)
        .setIssuedAt()
        .setIssuer(issuer!)
        .setExpirationTime(expirationTime)
        .setJti(cryptoRandomString({length: 16, type: 'alphanumeric'}));

    return await newJwtSigner.sign(rsaPrivateKey);
}