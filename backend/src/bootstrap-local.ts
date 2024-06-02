import { setupTestData } from "./testing/setup-test-data";
import { AppVisaIssuerEga } from "./app-visa-issuer/demo-issuers/app-visa-issuer-ega";
import { AppVisaIssuerAhpra } from "./app-visa-issuer/demo-issuers/app-visa-issuer-ahpra";
import { BrokerEurope } from "./app-broker/demo-brokers/broker-europe";
import { BrokerAustralia } from "./app-broker/demo-brokers/broker-australia";
import { BrokerUsa } from "./app-broker/demo-brokers/broker-usa";
import {BrokerAntarctica} from "./app-broker/demo-brokers/broker-antarctica";

// the development node bootstrap entrypoint
// this entrypoint is used for running the backend locally on a dev machine
// (though noting that even on a dev machine AWS dynamo tables etc. are still accessed)

console.log("Bootstrapping local server (broker and visa issuers)");
console.log("Creating fresh test data");

const PORT_EUROPE = 3001;
const PORT_AUSTRALIA = 3002;
const PORT_USA = 3003;
const PORT_ANTARCTICA = 3004;

const PORT_EGA = 4000;
const PORT_AHPRA = 4001;

// THIS IS *NOT* THE ENTRYPOINT FOR USE WITH THE (PRODUCTION) AWS LAMBDA ENVIRONMENT
setupTestData().then(async () => {
  console.log("Creating GA4GH test visa issuer servers(s)");

  const appVisaIssuerEga = new AppVisaIssuerEga(PORT_EGA);
  const appVisaIssuerAhpra = new AppVisaIssuerAhpra(PORT_AHPRA);

  await Promise.all([
    appVisaIssuerEga.listen(PORT_EGA),
    appVisaIssuerAhpra.listen(PORT_AHPRA),
  ]);

  console.log("Creating GA4GH test broker servers(s)");

  const appBrokerEurope = new BrokerEurope(PORT_EUROPE, [
    appVisaIssuerEga,
    appVisaIssuerAhpra,
  ]);

  const appBrokerAustralia = new BrokerAustralia(PORT_AUSTRALIA, [
    appVisaIssuerAhpra,
  ]);

  const appBrokerUsa = new BrokerUsa(PORT_USA, [appVisaIssuerAhpra]);

  const appBrokerAntarctica = new BrokerAntarctica(PORT_ANTARCTICA, []);

  await Promise.all([
    appBrokerEurope.listen(PORT_EUROPE),
    appBrokerAustralia.listen(PORT_AUSTRALIA),
    appBrokerUsa.listen(PORT_USA),
    appBrokerAntarctica.listen(PORT_ANTARCTICA),
  ]);
});
