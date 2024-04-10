import { fileURLToPath } from "url";
import { dirname } from "path";
import { join } from "path";
import { readFile } from "fs/promises";
import Handlebars from "handlebars";

const __filename = fileURLToPath(import.meta.url);
const __htmlname = join(dirname(__filename), "home.html");

/**
 * Render a HTML home page using templating to inject live data.
 *
 * @param brokerId
 * @param brokerDescription
 * @param brokerCountryCode two letter code for the country
 * @param users
 */
export async function renderHomePage(
    brokerId: string,
    brokerDescription: string,
    brokerCountryCode: string,
    users: string[],
): Promise<string> {
  // I realise the templating is no faster because we read/compile every time
  // but this is not needing to be high performance
  const htmlBuffer = await readFile(__htmlname);

  const template = Handlebars.compile(htmlBuffer.toString("utf8"));

  return template({
    brokerId: brokerId,
    brokerDescription: brokerDescription,
    countryCode: brokerCountryCode,
    users: users,
  });
}
