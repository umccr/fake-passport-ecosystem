import {ScenarioData, ScenarioUser} from './scenario-data';

export class Scenario2022 extends ScenarioData {

    private users: { [key: string]: ScenarioUser } = {
        'http://uid.org/0': { // no visas generated
            sub: 'http://uid.org/0',
            name: 'Ted Lasso',
            roles: {
                institution: null,
                dataset: null,
                linkedIdentity: null,
                termsAndPolicies: false,
                researcherStatus: null
            }
        },
        'http://uid.org/1': { // controlledAccessGrant + TOC visa
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
            }
        },
        'http://uid.org/2': { // AffiliationAndRoleVisa + TOC
            sub: 'http://uid.org/2',
            name: 'Mary Jones',
            roles: {
                institution: 'maryjones@test.com',
                dataset: null,
                linkedIdentity: null,
                termsAndPolicies: true,
                researcherStatus: null
            }
        },
        // linked identities (either will generate linkedIdentityVisa, terms and policies visa (x2) and researcherStatus visa)
        'http://uid.org/3': {
            sub: 'http://uid.org/3',
            name: 'Bruce Smith',
            roles: {
                institution: null,
                dataset: null,
                linkedIdentity: 'http://uid.org/4',
                termsAndPolicies: true,
                researcherStatus: null
            }
        },
        'http://uid.org/4': {
            sub: 'http://uid.org/4',
            name: 'Bruce Smith',
            roles: {
                institution: null,
                dataset: null,
                linkedIdentity: 'http://uid.org/3',
                termsAndPolicies: true,
                researcherStatus: 'clinician'
            }
        },
        'http://uid.org/5': { // ResearcherStatus visa + toc visa
            sub: 'http://uid.org/5',
            name: 'Thor',
            roles: {
                institution: null,
                dataset: null,
                linkedIdentity: null,
                termsAndPolicies: true,
                researcherStatus: 'researcher'
            }
        },
    }

    override getUsers() {
        return this.users
    }
}
