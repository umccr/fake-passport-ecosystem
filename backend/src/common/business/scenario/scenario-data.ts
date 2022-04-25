export interface ScenarioUser {
  sub: string;
  name: string;
  roles: Roles;
  expectedVisas: string[];
  // claims: any[];
}

export interface Roles  {
  institution: string | null;
  dataset: { dataset: string, approvedAt: number } | null;
  linkedIdentity: string | null;
  termsAndPolicies: boolean; // is there a scenario where this would be null?
  researcherStatus: 'researcher' | 'clinician' | null
}

// we need to flesh this out with data about the scenario - list of users, roles, what visas they should get etc
export abstract class ScenarioData {
  constructor() {
  }

  abstract getUsers(): { [key: string]: ScenarioUser };

  getUserSubjectIds(): string[] {
    return Object.keys(this.getUsers());
  }

  getUserById(sub: string): ScenarioUser {
    return this.getUsers()[sub];
  }

}
