import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";
import Handlebars from "handlebars";

const __filename = fileURLToPath(import.meta.url);
const __basename = join(dirname(__filename), "base.html");

export function registerBaseLayout(name: string){

    const baseBuffer = readFileSync(__basename);
    const baseContent = baseBuffer.toString("utf8");
    const baseTemplate = Handlebars.compile(baseContent);

    //const partial_path = path.join(HBS, partial);
    // const { name } = path.parse(path.basename(partial_path));

    Handlebars.registerPartial(name, baseTemplate);
}
