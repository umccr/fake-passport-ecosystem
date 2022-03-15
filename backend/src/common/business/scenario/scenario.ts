import { Scenario2022 } from "./scenario-2022";
import { ScenarioData } from "./scenario-data";


export function getScenario(scenarioId: string): ScenarioData {

  if (scenarioId == "2022")
    return new Scenario2022();

  throw new Error(`Unknown scenario ${scenarioId}`);
}
