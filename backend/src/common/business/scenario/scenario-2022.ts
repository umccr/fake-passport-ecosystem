import { ScenarioData } from './scenario-data';

export class Scenario2022 extends ScenarioData {
  override getUsers() {
    return [
      {
        sub: 'http://uid.org/123',
        name: 'Bruce Smith',
      },
      {
        sub: 'http://uid.org/456',
        name: 'Mary Jones',
      },
    ];
  }
}
