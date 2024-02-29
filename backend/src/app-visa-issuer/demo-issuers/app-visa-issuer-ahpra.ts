import { AppVisaIssuer } from "../app-visa-issuer";
import { makeVisaJwt } from "../../common/ga4gh/make-visa-jwt";
import {
  BRUCE, DAVE,
  JOHN, LISA,
  ROR_AHPRA, ROR_CSIRO, ROR_EMBL,
  ROR_MCRI,
  ROR_NIH,
  SVEN,
} from "../../common/people/subjects";

export class AppVisaIssuerAhpra extends AppVisaIssuer {
  constructor(domainOrPort: string | number) {
    const id = "issuer-ahpra";
    const issuerString =
      typeof domainOrPort === "number"
        ? `http://localhost:${domainOrPort}`
        : `https://${id}.${domainOrPort}`;

    // this is a 2048-bit RSA key
    super(id, issuerString, {
      kty: "RSA",
      alg: "RS256",
      kid: "duxP4QzeqR7f/FbaLzL+IZaVql0=",
      e: "AQAB",
      n: "gIKBbsy1aY7GUVXgkJjGP6J-HaEiocl_G5yjquuDKUA0oO5k4EHctqthId7a_hVcD_KKAYpXljTftaVq0iWyNVF61xzVOtgOvgYmMQ9bGQZF-CeAkQDJBLBjwF4YN4aQbr2Jy8x-6fmEihuDntKgVu4TDsXt4ahj7d5nP5wuRjFgY8Vnf8BZEc9LA0KtkoF3Bm62ksSiv-tcVRRpgJp74Cp9nV-MbakJisopO6WHtjcOFwWm3aqNpSg85-iQWMT3yMp2Sdus0yvntvqmgOnGrt_-cWBC6DNgViyY8XFPVnsExXIFFUHLkXzsSv9Wxjb9MxD4jdqN396XtpcDkan8Ew",
      pBase64Url:
        "v5CUSenm1_B6hrQ64oUbd27D_0YAJFojvvMRzlREw8NUuUaHWg1RWKlww5wy7mQMmhZjSIOpWbkmOQ2IlE4YTMAvvRN-l9eQP6pxq_qk8-EVrMCYoNFBsE3tJNT5eVWqZDL2EnLtYGWraPUGWa2c6rxfO0tVynn7_2EE01oVhVM",
      qBase64Url:
        "q7xVzSmpuBP-6WQ-r4FN0enBWx4saFJ9KHsZBho6IRj5u_FIY4MZ_e_aPwUBHwg4CDepVgQ1U2w55t_-DJWjB16BJ80q7HiZr3zWUjFDeSCzYJ8hkY362WcODoC5BcJfFLO2A1-bzpL1gB5DRI7R3MVAoBNfG8x0tzyLjN6KFkE",
      dBase64Url:
        "RGQv-gWb7md7h8HKV2nW5_rUX3Rn9-5CZTGBsO7RyNxQpez5ZpfmnJisgtgVd-9qJVqQs60qW9gbzpIQPXKuWs3YMC86E6z0e5DONoHTm4fJKP3s4D6ovIQbMj9hZ_uHVkgs03cre928-bsW2ymBB4KARfZ0WQnC1M7t5954igXvy5BARrNPrncooJcSwAYGGW3-DxYFeZLAkDtziEWCox0wosxb7UZuuzNOGheWW1BWqIhQNUjhW1_mfCIuy_yrS1V8G54EDWS5IdCU4Vhsnz98YEYeuqWTKAof5zkvnmvTYmW4pauWO4urcrSVV05jtOFcBMFnZrIhf64WtMZfAQ",
      qiBase64Url:
        "ikZYgXwdABts-UuyOkFRrTsF3_VD4rgtNm8Rrez-qB-3hFkeyFRKRJk5v8NyQ2SaGYIvG2tzYVn-gDm53XGInDM8Nss15LM4Aje6KjJlOwtLfjHnQ-oG9bEBN0mB2uYzQaYoy8G2rOeNSHBtCRg_3j_r00C2cH64mAA_lxyWl9I",
      dpBase64Url:
        "E9aiNMFfYa-K0NZrXrgQLx8udwpFy332Q7kid-6sLGXXKVTPgZjterQZdHiBocSEtZRp9cGE0UDmX3QyV8F6rMAecYNKUelGDAHXwcq0OHlv6DMN22GwXtTDIVRY_aLMgZHxf9mdEaWVycnOPY1IOdsGNbrIiK53VWwztruWjPc",
      dqBase64Url:
        "TJscYwI8tOImiZGv7LXvMr3lBHI3OOni7pXKmdBFMdJkRBPjSJCInZ_KaOYgk-kkpXW-0aHa77WNNpGgT5jIOldLoaeBiC5bz84OBGf5QyT1Hxqc7MK6rROtT4bYAdusch2gCW0yoTkozdeyBfj3YFWU-FLr0Aip37rgPRxf2IE",
    });
  }

  public async createVisaFor(subjectId: string): Promise<string | null> {
    let source, value;

    switch (subjectId) {
      case BRUCE:
        source = ROR_MCRI;
        value = "faculty@mcri.edu.au"
        break;
      case JOHN:
      case SVEN:
        source = ROR_NIH;
        value = "faculty@nih.gov"
        break;
      case LISA:
        source = ROR_EMBL;
        value = "student@ebi.ac.uk"
        break;
      case DAVE:
        source = ROR_CSIRO;
        value = "faculty@csiro.au"
        break;

    }
    if (source && value)
      return await makeVisaJwt(this.key, this.issuer, this.kid, subjectId, {
        ga4gh_visa_v1: {
          type: "AffiliationAndRole",
          asserted: Math.round(Date.now() / 1000),
          value: value,
          source: source,
          by: "system",
        },
      });
    else return null;
  }
}
