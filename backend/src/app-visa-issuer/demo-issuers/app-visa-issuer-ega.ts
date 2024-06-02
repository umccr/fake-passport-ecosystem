import { AppVisaIssuer } from "../app-visa-issuer";
import { makeVisaJwt } from "../../common/ga4gh/make-visa-jwt";
import {BRUCE, DAVE, EUROPE_PEOPLE} from "../../common/fake/people";
import { ROR_EMBL } from "../../common/fake/organisations";

export class AppVisaIssuerEga extends AppVisaIssuer {
  public static id = "issuer-ega";

  constructor(domainOrPort: string | number) {
    const issuerString =
      typeof domainOrPort === "number"
        ? `http://localhost:${domainOrPort}`
        : `https://${AppVisaIssuerEga.id}.${domainOrPort}`;

    // this is a 2048-bit RSA key
    super(AppVisaIssuerEga.id, issuerString, {
      pBase64Url:
        "3a9xP8-VopskVxwyLzSYkDXxZXMziiSsG-zgIoBJzz1Md-Fv7lDvjZqHy9L1EHbtg8SIllhnshZRR38XjtLeFJopkxa7oCrmFi3P-v2zv6Ytwbzrh74w30HCBC7Ail6W9R4iA7UKs-euKzbZosIafI3oqML2ldVid7G_hTdbFv8",
      kty: "RSA",
      qBase64Url:
        "pdz_wIENuB9qwzivWz1MqChlyFvA7ymA6zzvyfwvdJR5HH_3lI2OwQfvG26e6C_6rnhG8xi2IFptFWJlfvdhA_G4Kvvz_X0QnsmlCibTTa6m5F3xPdJpufMMEAxEvd4EAB189B9vyuHmGQ-SjaTwZ9ogCe7CB8d6kWzBUXlwMd0",
      dBase64Url:
        "M3IPIg5EZoQ7Y7uDWOwwhjDvPrZlWiFgw6J8PKPbyH65o3mwbuGEQdTdEgsKmNOaTuXW1L1dxIY3YBKjtxeCJ0TMgU_mVzcDYdLxe5dYXcarPBRmrrEptMzt46Ii-s8zVRtAlxXOf7O-fawbHcGbs3p3ncCrKBSJ47SZx4XYZyvRO42PNI8dYaL_Y0COBrI3c2eXS7_fSwEYOL8yyYcd9rc7rkVhkjtiwBZiKsFZD5h2RabrwLs2ydd1TaIN7pr2FjE0d4swBZhwzkk4tvUqgUN8vNvCG6pOnoAIke0dxBYj3n6UJDFTzKUryCsBDAGtvkYrSUFfDNyT1hiVPaeKEQ",
      e: "AQAB",
      kid: "3SF+XZjbftVYC4i+4frol7AUj5k=",
      qiBase64Url:
        "kD3BmEsu9Sx-Hi_Pukot46GVWxD0KruJ6dL08G-mkUQhHQXBxm4oQhBuSZGoQRzTC7MdvSkmuT_wyn9owpPq2zhpvSc_6iPgrwyKgfmULBQb0WMr2kJ5ruoY8swKnwRpnEnhu3c8g7Ip-MUy8pBe7xhfectSY_Xarqwg8tkLZvM",
      dpBase64Url:
        "hjizWO9Wqh1E43ku6WXu-WGvxrz5d6q8iivhiQIjrlZu9iaInsJiSFpH3iDcQBvBswZLrLvaDPl2PNO2b8M8szyj72rULyXKKaOTSWRScLcs_SBlesqszIAD-IRWD3E19TNJZPU4hbTAv2l2XBUp9D_3njZtFkscU1xLmVzqygE",
      alg: "RS256",
      dqBase64Url:
        "hW7kJQbtdYl4xzLsB5ep-sH9GBGQhha6iwSL18_UkZH8WMwt7clv5aSvXD9DAYHPxtomId1ob2CvzvtIsbrrxlOImLP21p_tZgDMj_0qEp2Fz8Qvlk-XFKwNsT9dce2RBFK0umQr-GiBRvn7KY5ehP26tqLoX3_AAAwg_Z2Xf9U",
      n: "j6F0O-jGn3Ku4hWro21xgrATtrAmOCDsULzMO2pKmUYllUqdnXo-SUE5z1yjzUpuyQ8MAKgP5jgCr5p80tH4Q_Pp_ljEupbVBNh992pUd0EH3DmzCiP-O54NfE2iIlrYi-0hPoQFCHcoWDvFkNtwMA1h3rgN4VR0CgRKjXbkmB7rhDonZvn3eTHIf3_y6cX3Uqk4GJ_sLHAcfjzYOzwfQwH1Mhto3aGhZyv2Vxm9B63IsY7hqkBBxvHfNzM9TWhvm6_0TeDW4Dhiovtjln2aFbVfEa9qJarUR76PnfQc_3eOv4p-gHSP_wyl9gM--8g75ClYR6NJmRBuSaEAz5mpIw",
    });
  }

  /**
   * A realistic grant of access to the CINECA dataset.
   *
   * @private
   */
  private createCinecaAccessGrant() {
    return {
      type: "ControlledAccessGrants",
      asserted: Math.round(Date.now() / 1000),
      value: "https://ega-archive.org/datasets/EGAD00001006673",
      source: "https://ega-archive.org/dacs/EGAC00001000514",
      by: "dac",
    }
  }
  public async createVisaFor(subjectId: string): Promise<string | null> {

    // everyone is Europe gets a visa for CINECA
    if (EUROPE_PEOPLE.includes(subjectId))
      return await makeVisaJwt(this.key, this.issuer, this.kid, subjectId, {
        ga4gh_visa_v1: this.createCinecaAccessGrant(),
      });

    switch (subjectId) {
      // bruce from Australia also gets CINECA
      case BRUCE:
        return await makeVisaJwt(this.key, this.issuer, this.kid, subjectId, {
          ga4gh_visa_v1: this.createCinecaAccessGrant(),
        });
      case DAVE:
        return await makeVisaJwt(this.key, this.issuer, this.kid, subjectId, {
          ga4gh_visa_v1: {
            type: "ControlledAccessGrants",
            asserted: Math.round(Date.now() / 1000),
            value: "https://ega-archive.org/datasets/EGAD00000000001",
            source: ROR_EMBL,
            by: "dac",
          },
        });
    }

    return null;
  }
}
