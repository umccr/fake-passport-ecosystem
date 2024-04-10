import { AppBroker } from "../app-broker";
import { AUSTRALIA_PEOPLE } from "../../common/people/subjects";
import { AppVisaIssuer } from "../../app-visa-issuer/app-visa-issuer";

export class BrokerAustralia extends AppBroker {
  userList(): string[] {
    return AUSTRALIA_PEOPLE;
  }
  description(): string {
    return "Australia";
  }
  countryCode(): string {
    return "au";
  }

  constructor(domainOrPort: string | number, visaIssuers: AppVisaIssuer[]) {
    const id = "broker-australia";
    const issuerString =
      typeof domainOrPort === "number"
        ? `http://localhost:${domainOrPort}`
        : `https://${id}.${domainOrPort}`;

    super(
      id,
      issuerString,
      {
        pBase64Url:
          "5UCzVMfbbHdv4M8PUzjah5zmXK-CYcQ8yPO-lPZJ_qhTphCtxhS2D3TEgy1y4WQTIKv3UC3zbQG90q4Pyw_0zw0g-i01ypev0Qfe7ohJIdBlHt1LHHJ86Mzx3ieuDn8cvLFerggrFSnfaWN7hbCZRnxRw4LxDBaswvaDBc5tRRk",
        kty: "RSA",
        qBase64Url:
          "v_go0WHlpI7q24PZ5l4azaEmCpkqNdx2d6q4_IANP0lXu40UAaoNhJ3BZAneNiXjzR4TRgtsLeL46PLmcOTrczJFPiZdhIO6xKxNFIsDq1E4i8IsrJMFwFr53UUgKH77rV_-AxQG6kkLHpTEsCRfBVnFZuSQdZ6jnDOtLYy60yM",
        dBase64Url:
          "CFFlB9wRRFE7poCFTAJeEQl-gIrA7OsPf-4ZGwxtD38FEFK5MskTIo2oSGtI90zk9fQ9urb5ULofBOvGr1Qba2yu2DZNMDgOC2M4UbQeU1FhYwViwyZR0alLWhh1SXwcI5CVAz16sTYbYqVJW83VmmTMhBAJyuDk7MuaLezmqrFbRrme82M4NKD3JkMIUMnHXqUw60lw4F4ThC7oJGuyKYLZm7W_3J5hu9EAhvzjm9I4H-vsvBV54F2X4Eoaa414zKFO6bqEjtnvvrbOpFPudkaGSUp97ykD4n4NmCY_UMg1DcWf0M7Mwo3ZJVgTazWSsEcYw2eOBr58whhFVdsRkQ",
        e: "AQAB",
        kid: "OjZ2464mqgVzTQ27AcESW/5fxyQ=",
        qiBase64Url:
          "dz4z2X0pq1bnAp0E4sWiwhZeX8pqaP2E9qkQsUjvFvDB_82loxLws6tSZtzPpjjO5YobXYeX5whvXKE1ftdp-3Z7831X3OftyGbiRXXuVG9D0XY5R81iBjeiKlk3ldaDTHnCX6vZ_9nkLPHwAQmESORSZn3HmGGqKPq87K9kLvA",
        dpBase64Url:
          "pz4WFWlfd7eCFJy5b1rwgTJDE6auFSiVt3upsv4haPffXiyYuQJu9sOWgKPtROQ-1_zcBNAg34r_sextdRQE4e-P-TJ2JX-XMYTua1FdGJ_wxR1nKC-VVDf-0rRb1BODIVy713X6CAxuAXIjsJnul28mLt0dgFYiXnB7kQbQzDE",
        alg: "RS256",
        dqBase64Url:
          "a1byU-meg34aWnYGUCaMbDBQWhq8nHNSlqUSXLWpMprrAIbpCekxN9cR_ML7ymEzWE0Zz8-xRJMmRPMU4UlPUhFo4FCJeABEXZZOX08_1PpMWPFRE4n97EmybwQo8BvY1F_ZY5U-LKB9JDNhK3Ca5R4GH_trvyjeKQhILDEFges",
        n: "q-mBB5jBJCCc68ALWF_A-zOM4S5gsKPB6qeFYWe_uzkfWf-jcSCHRrRCsMRzflVvZbz3mbBmqp8FVOnEWQe62x0qdNSZRUmRWkeBKhi0yxjXbKV7e11Sv5XWxxGhYL-gYzJXqQLR9T8ZfcDeQvEtobznm51VkZ1UgD6QogjtpCK-LL3t5NK2wS5lZO3K5GM4spbnXOLbbUU0sRHKujkYa6frY71i3EAs_nrzkTRmT0I_QkE24XlGRh0zbM67pW1n9SKHsEpFIEzXy3ebBfHhaWKdxY4qhGqbOvft-rgNGGAXPEkKbygIcE0Uif1DvaNHD6KDAeP0DGJVr3qCKQ4Naw",
      },
      visaIssuers,
    );
  }
}
