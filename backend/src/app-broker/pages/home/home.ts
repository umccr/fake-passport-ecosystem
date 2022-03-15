import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { join } from 'path';
import { readFile } from "fs/promises";
import { render } from "pug";
import { FixturePayload } from "../../../common/business/fixture-payload";

const __filename = fileURLToPath(import.meta.url);
const __pugname = join(dirname(__filename), 'home.pug');

/**
 * A home page that can display details of the fixture
 */
export async function renderHomePage(brokerId: string, fixture: FixturePayload): Promise<string> {

  const pugBuffer = await readFile(__pugname);
  const pugTemplate = pugBuffer.toString("utf8");

  return render(pugTemplate, { brokerId: brokerId, fixture: fixture });
}
