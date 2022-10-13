import { Scenario2022 } from "./scenario-2022";
import { ScenarioData } from "./scenario-data";
import {ScenarioError}  from "./scenario-error";

export function getScenario(scenarioId: string): ScenarioData {
  switch (scenarioId) {
    case '2022': {
      return new Scenario2022();
    }
    case 'error': {
      return new ScenarioError();
    }
  }

  throw new Error(`Unknown scenario ${scenarioId}`);
}
