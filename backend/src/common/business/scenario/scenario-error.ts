import {ScenarioData, ScenarioUser} from './scenario-data';

export class ScenarioError extends ScenarioData {
    private users: { [key: string]: ScenarioUser } = {
        'invalidVisaSignature': {
            sub: 'invalidVisaSignature',
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
        'expiredVisa': {
            sub: 'expiredVisa',
            name: 'Mary Jones',
            roles: {
                institution: 'maryjones@test.com',
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
        }
    }

    override getUsers() {
        return this.users
    }
}
