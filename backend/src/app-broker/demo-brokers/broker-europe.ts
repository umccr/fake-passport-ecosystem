import { AppBroker } from "../app-broker";
import { BRUCE, LISA, STEVE, SVEN } from "../../common/people/subjects";
import { AppVisaIssuer } from "../../app-visa-issuer/app-visa-issuer";

export class BrokerEurope extends AppBroker {
  userList(): string[] {
    return [BRUCE, SVEN, LISA];
  }
  description(): string {
    return "Europe";
  }
  constructor(domainOrPort: string | number, visaIssuers: AppVisaIssuer[]) {
    const id = "broker-europe";
    const issuerString =
      typeof domainOrPort === "number"
        ? `http://localhost:${domainOrPort}`
        : `https://${id}.${domainOrPort}`;

    super(
      id,
      issuerString,
      {
        pBase64Url:
          "_EXWROqGhPCsVjVndXWlfvfj9lo-s20QQDDrdTaKYlKnNOs3dzFrnIhUFQdk4CNE5UXR-UBpZaL5MuxTasK12lA0zk1kYyMk8EscUgMZ75lZUmxG4cIm4V11T-B99KVfhO2-_2y3Xjd6BmX0X8rVDkqSyZgkNEUkEWT5gFeq6fk",
        kty: "RSA",
        qBase64Url:
          "oe9e1ZlfKkwKF3jZcoUg9k5vnieR4qa715gev3BQ3RUjg2Wo4-SOzyY0PzaVEXn27b0S-H4h0e1r98UENYbd2Xxwny69NtUBanRdE3vFYcos4ZnCnRbpCnow6B2Dhs0ark_lE85YBOcy4tbc4Gm-ga0XsQ8fKjjv0e4BGhFAz98",
        dBase64Url:
          "eRkrvHiwTwyeBkQsivoUeaXW6QJaBhwFo33gP0t8ueAfRMM59BkHk75IV2mNsiLPV6G-crGYgat16LkLH5HIGWAonLAXwVSr2AQHZ0KFmA6bkMlpmAoF6QkGdVC773qArMczaJ27pCSjdB4dy76Q5d87xAP9MeVG9qTXCbq8bfA-2uJBYng0O_AOYRCz-lQE5vXP7bV-9Ydbwla4bm6TE-IECS8Ly4O_fz1Zf1uB5Er8UAJfjiFgCxewjrBD7Y2YVZr2eM1pNCVUTQjgJxN-cX6e1f1YpQO9yMSTd7tbQqVd-dyr3jNh87VED1YkRlIMikwZdV4vMDdSVcZDokbyYQ",
        e: "AQAB",
        kid: "3DMKVg4YzQUy0GjDReF85Fo8JVo=",
        qiBase64Url:
          "UK7iTBhwcbPZrlAbQa4bBkWhgFCDif4fQkIjP1W2ATkVcIF1lmvC8999OPlzgLrGlYUm5ASZEyubWf4nHjMsWJjM2Plvm2h56mlowvPa0ZGmoxjJJgxtismVjJa3BDhUfmFwouKrdEjF7XaGhp_v__8K4eDN7C1PPXfvFxwN8XU",
        dpBase64Url:
          "zC_mhy9gI_f9NWXSUJMhmcwg2kQfHfE3xw0Rd3Tmu0B1D_MWmMYKeM8rZz3t2zEQ0ZYapukIpfgsRZhcyDvDH2nt49FmYIuQmWHiEUtrUbBISNtU3-Pavmx7yGRG7p5v2tLn1ivzmzHB9a3OBz7QBdo8Ryl6nEgeMmoNPGE4-Fk",
        alg: "RS256",
        dqBase64Url:
          "SBxQHs4tkqhJ1in6qwSdqRFEoyj7zfJxs5AKITXizJCdP-YFT3Z4IcbhfUTRHPcy_qszx3Rjmxge_Da_qRZltHO1sy0dFU3FU6J90C9Ntj5RviS6hTmujPvcy4BZEa5EM1tgp3E7wPMztc_4i_aK3zQ1WKNjPWodYV6bHwCP3AE",
        n: "n5POaIPBp04XYkujy7ILkeYpuqPtzRz6fWNFZy7fR6qPLycP4aANFA2xRjr5YP1XXRnm7Jg23gmSbGYFNlnKDRNf67PM53L9Afx56DAUufH0vAISOq2e-i2P4aWZCGcc-d-8tmNTQ3FFcS2wD3bwUsVG2uLXVcdHvmvbTVVIXYxNiznXLk3sNBjuL40VIKEK_x8KSX04_0_x07KKFW1rqj1sguzBeF-NJRTGKuplFEwVM5TxAXRNQe1VeC3_TAEK4PRD8bzzFBz3y-fyovlppfjeOEbIlLT4mafzD130dlINw4xdaLQIPkQb8UE8O-XNKUzguSdUOw0TYB49mFIm5w",
      },
      visaIssuers,
    );
  }
}
