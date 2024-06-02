import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFile } from "fs/promises";
import Handlebars from "handlebars";

const __filename = fileURLToPath(import.meta.url);
const __htmlname = join(dirname(__filename), "passport.html");

/**
 * Render a HTML login page using templating to inject live data.
 *
 * @param loginUrl
 * @param brokerDescription
 * @param brokerCountryCode
 * @param users
 */
export async function renderPassportPage(
  brokerDescription: string,
  brokerCountryCode: string,
  name: string,
  passport: string
): Promise<string> {
  // I realise the templating is no faster because we read/compile every time
  // but this is not needing to be high performance
  const htmlBuffer = await readFile(__htmlname);

  const template = Handlebars.compile(htmlBuffer.toString("utf8"));

  return template({
    brokerDescription: brokerDescription,
    countryCode: brokerCountryCode,
    name: name,
    passport: passport,
  });
}
