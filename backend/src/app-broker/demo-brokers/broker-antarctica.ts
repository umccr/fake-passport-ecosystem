import { AppBroker } from "../app-broker";
import { ANTARCTICA_PEOPLE } from "../../common/people/subjects";
import { AppVisaIssuer } from "../../app-visa-issuer/app-visa-issuer";

export class BrokerAntarctica extends AppBroker {
  userList(): string[] {
    return ANTARCTICA_PEOPLE;
  }
  description(): string {
    return "Antarctica";
  }
  countryCode(): string {
    return "aq";
  }

  constructor(domainOrPort: string | number, visaIssuers: AppVisaIssuer[]) {
    const id = "broker-antarctica";
    const issuerString =
      typeof domainOrPort === "number"
        ? `http://localhost:${domainOrPort}`
        : `https://${id}.${domainOrPort}`;

    super(
      id,
      issuerString,
      {
        pBase64Url:
          "xyNxC40YuhLfXVdeCXECmRXmmdna9m2M-PyKWteXIIC1B25U79MuDeWbBda6VgSgLbAKjsTjS5ig1hw7QOUix_rLgOU9ECTqGNoz1lSK9TwIqUtvRBMrsAX1jj67nZA_qAB88sygTQGAJG3ErdukNPeTkGXmG9QlTANAmZzqBa8",
        kty: "RSA",
        qBase64Url:
          "u1kYRFzkT_XShzMSj8AD34ivam7lXutBdjQ7CVc9Z1ZupVzg5m3yh4r4tYLDarUi2CTuxQAnyeEVXZJfmGdWIgfP_aYcofgJiqy2ImP0EhPve8Avytym0vc1n0NC1YYvddE4P_Ni4JJvVawEoAyA1_EoTSQdtyotjfoLI9cxfUc",
        dBase64Url:
          "iJSDYXKmqXcRi3cYFJeou_wKDdGlfwlb0hVpaJzvm1_etUo8H6_vbuHMK42qFGb9Kqxm_a-7vCpCCyRNv1j5QyoKNBjH4L33K1c0AOA7GM50s2kyXa4xDrBYhZQzG_cxSaL-RndAd6gYzrr6n_ATzJWDMvu7G24IcpFBSc_I5zatAJgbOcwritRwaercbU8WoUCEWx1y9vCf-ISCypAbHqQXai_4zb_PohJQlm_Ym44L1o73UIHQOHkxFiHDcTj3fxdKWP9tEHN2DaeZkoX5jnzteIhOj7Pv9J-HwauhsoBPEa9yMKVHkpv23pDklI3AmGSlYt2Y-yd6qsG5DYt4cQ",
        e: "AQAB",
        kid: "nGFQ9w4hKXd8DEaaMDcysmswX5Q=",
        qiBase64Url:
          "H7P6Req5gjQwgGjLi_bDyKVVH5zDo5iHL_jdffVDR6jVkh445bC9LFTbN2Ipts4TeF6Kq4XYORYRhSuSGT9734rtBdvuRiD_HT68o7_hyK81LWi3VEcRoZAbsWL1mq01XpLAVGlRu5SLiHlfY2rRp15Jt_QtnqKLVWDz1ZJyF00",
        dpBase64Url:
          "UXqn42EM7_2O1QNNX7GUrYxveR3RYKj8WFgESB0UIeFnsK2tJR-UJW1_24i7XzyvSWJRP49BrQm7LUAJ4oiejZKJN6kULgncmuSU9ypKXQL-TD6oPQNXCcO2cEgsvdBqq1Pfy_x7zmZBxyX-pmBLNLzj7N40o8hOpmZiRTgV7NM",
        alg: "RS256",
        dqBase64Url:
          "rKJusCAA6oWUl6zCP-AqMYMcUTEa_xo9WhTLCdJv7JdCofIx82QBBlFS2L9EH0IGd7Ggq7t27poQPAczO5aNUhJs4Eh_Pej3sedwdcQxFa91EE2KPJ6Swve1W6p5HZTmiuRdtuApjtKg8QrvwCOFXncEMgFDuJKPI7LzLPWQzuU",
        n: "kbwxxj1akDRDTJPc52hW6P7oe8F1yotj_zRywzCiJ3Gpj14FE4o5g4gByh-ZtWnbj82oPy6SMnmIN4Lc66NWy6WPQWrEmoqT_Kim9GWu2DXOoAKO6JP56xla3vV7l0aHNtGq-niig9hjmB2D57QOuWYurxX7h0P0dyVYSqD2taFDOsC_AhO8Sa7BVtHsVgCAlxR7NGb2hITW1DntKDCq6crJtnNz6bON1BWRigJCNx0Zfag98ZiIcGXdlaRXgJMGjZS2-wcHBgefVI3wOg2b0Am7zPEQiZDsF5d_eQnZw2YR8LYys05aebEQE6Zn9GRK3x6Fhm0bmoJ9xMu22S0GiQ",
      },
      visaIssuers,
    );
  }
}
