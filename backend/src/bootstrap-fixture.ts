import {AppVisaIssuerEga} from "./app-visa-issuer/demo-issuers/app-visa-issuer-ega";
import {AppBroker} from "./app-broker/app-broker";
import {AppVisaIssuer} from "./app-visa-issuer/app-visa-issuer";
import {AppVisaIssuerAhpra} from "./app-visa-issuer/demo-issuers/app-visa-issuer-ahpra";


/*

export function createBrokersAndVisaIssuers(a: Record<string, string | number>) {

    const resultBrokers: Record<string, AppBroker> = {};
    const resultVisaIssuers: Record<string, AppVisaIssuer> = {};

    for(const [id,domainOrPort] of Object.entries(a)) {
        switch(id) {
            case AppVisaIssuerEga.id:
                resultVisaIssuers[id] = new AppVisaIssuerEga(domainOrPort);
                break;
            case AppVisaIssuerAhpra.id:
                resultVisaIssuers[id] = new AppVisaIssuerAhpra(domainOrPort);
                break;
        }


    }



} */