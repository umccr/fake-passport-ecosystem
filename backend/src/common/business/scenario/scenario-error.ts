import {ScenarioData, ScenarioUser} from './scenario-data';

export class ScenarioError extends ScenarioData {
    private users: { [key: string]: ScenarioUser } = {
        'invalidVisaSignature': {
            sub: 'invalidVisaSignature',
            name: 'Tony Stark',
            roles: {
                institution: null,
                dataset: null,
                linkedIdentity: null,
                termsAndPolicies: false,
                researcherStatus: null
            },
            expectedVisas: [
                'invalidVisaSignature'
            ]
        },
        'expiredVisa': {
            sub: 'expiredVisa',
            name: 'Mary Jones',
            roles: {
                institution: 'maryjones@test.com',
                dataset: null,
                linkedIdentity: null,
                termsAndPolicies: false,
                researcherStatus: null
            },
            expectedVisas: [
                'expiredVisa'
            ]
        },
        'invalidIssuer': {
            sub: 'invalidIssuer',
            name: 'Mary Jones',
            roles: {
                institution: 'maryjones@test.com',
                dataset: null,
                linkedIdentity: null,
                termsAndPolicies: false,
                researcherStatus: null
            },
            expectedVisas: [
                'invalidIssuer'
            ]
        }
    };

    override getUsers() {
        return this.users
    }
}
