import { fileURLToPath } from "url";
import { dirname } from "path";
import { join } from "path";
import { readFile } from "fs/promises";
import Handlebars from "handlebars";

const __filename = fileURLToPath(import.meta.url);
const __htmlname = join(dirname(__filename), "login.html");

/**
 * Render a HTML login page using templating to inject live data.
 *
 * @param loginUrl
 * @param brokerDescription
 * @param brokerCountryCode
 * @param users
 */
export async function renderLoginPage(
  loginUrl: string,
  brokerDescription: string,
  brokerCountryCode: string,
  users: string[],
): Promise<string> {
  // I realise the templating is no faster because we read/compile every time
  // but this is not needing to be high performance
  const htmlBuffer = await readFile(__htmlname);

  const template = Handlebars.compile(htmlBuffer.toString("utf8"));

  return template({
    loginUrl: loginUrl,
    brokerDescription: brokerDescription,
    countryCode: brokerCountryCode,
    users: users,
  });
}
