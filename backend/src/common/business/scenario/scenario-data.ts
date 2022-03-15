export interface ScenarioUser {
  sub: string;
  name: string;
}

// we need to flesh this out with data about the scenario - list of users, roles, what visas they should get etc
export abstract class ScenarioData {

  constructor() {
  }

  abstract getUsers(): ScenarioUser[];

  getUserSubjectIds(): string[] {
    return Array.from(this.getUsers().map((u) => u.sub));
  }

}
