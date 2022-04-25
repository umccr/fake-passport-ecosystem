import {ScenarioData, ScenarioUser} from './scenario-data';

export class Scenario2022 extends ScenarioData {
    private users: { [key: string]: ScenarioUser } = {
        'noVisas': {
            sub: 'http://uid.org/0',
            name: 'Ted Lasso',
            roles: {
                institution: null,
                dataset: null,
                linkedIdentity: null,
                termsAndPolicies: false,
                researcherStatus: null
            },
            expectedVisas: []
        },
        'ControlledAccessGrant': {
            sub: 'http://uid.org/1',
            name: 'Tony Stark',
            roles: {
                institution: null,
                dataset: {
                    dataset: 'test-dataset',
                    approvedAt: 1549632872
                },
                linkedIdentity: null,
                termsAndPolicies: true,
                researcherStatus: null
            },
            expectedVisas: [
                'ControlledAccessGrant',
                'AcceptedTermsAndPoliciesVisa'
            ]
        },
        'AffiliationAndRole': {
            sub: 'http://uid.org/2',
            name: 'Mary Jones',
            roles: {
                institution: 'maryjones@test.com',
                dataset: null,
                linkedIdentity: null,
                termsAndPolicies: true,
                researcherStatus: null
            },
            expectedVisas: [
                'AffiliationAndRole',
                'AcceptedTermsAndPoliciesVisa'
            ]
        },
        'LinkedIdentity': {
            sub: 'http://uid.org/3',
            name: 'Bruce Smith',
            roles: {
                institution: null,
                dataset: null,
                linkedIdentity: 'http://uid.org/4',
                termsAndPolicies: true,
                researcherStatus: null
            },
            expectedVisas: [
                'LinkedIdentities',
                'AcceptedTermsAndPoliciesVisa',
                'AcceptedTermsAndPoliciesVisa',
                'ResearcherStatus'
            ]
        },
        'Clinician': {
            sub: 'http://uid.org/4',
            name: 'Bruce Smith',
            roles: {
                institution: null,
                dataset: null,
                linkedIdentity: 'http://uid.org/3',
                termsAndPolicies: true,
                researcherStatus: 'clinician'
            },
            expectedVisas: [
                'LinkedIdentities',
                'AcceptedTermsAndPoliciesVisa',
                'AcceptedTermsAndPoliciesVisa',
                'ResearcherStatus'
            ]
        },
        'Researcher': {
            sub: 'http://uid.org/5',
            name: 'Thor',
            roles: {
                institution: null,
                dataset: null,
                linkedIdentity: null,
                termsAndPolicies: true,
                researcherStatus: 'researcher'
            },
            expectedVisas: [
                'AcceptedTermsAndPoliciesVisa',
                'ResearcherStatus'
            ]
        },
        'TermsAndPolicies': {
            sub: 'http://uid.org/5',
            name: 'Thor',
            roles: {
                institution: null,
                dataset: null,
                linkedIdentity: null,
                termsAndPolicies: true,
                researcherStatus: null
            },
            expectedVisas: [
                'AcceptedTermsAndPoliciesVisa'
            ]
        },
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
                institution: null,
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
                institution: null,
                dataset: null,
                linkedIdentity: null,
                termsAndPolicies: false,
                researcherStatus: null
            },
            expectedVisas: [
                'invalidIssuer'
            ]
        }
    }

    override getUsers() {
        return this.users
    }
}
