import { EdDsaJose } from "./ed-dsa-jose";
import { RsaJose } from "./rsa-jose";

export type AnyJose = EdDsaJose | RsaJose;
