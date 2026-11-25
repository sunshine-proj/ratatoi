/**
 * Launch readiness check: `npm run launch:check`.
 * Lists what still blocks a public launch and exits with 1 until nothing does.
 * Run with Node 24+ (native TypeScript type stripping); no app aliases used.
 */
import { existsSync, readFileSync } from "node:fs";
import { operator } from "../config/operator.ts";

type Check = { name: string; ok: boolean; fix: string };

const read = (path: string) => (existsSync(path) ? readFileSync(path, "utf8") : "");

const accessibility = read("docs/accessibility.md");
const dietitian = read("docs/dietitian-review.md");
const packageJson = JSON.parse(read("package.json"));

const checks: Check[] = [
  {
    name: "Licence chosen",
    ok: existsSync("LICENSE") && Boolean(packageJson.license),
    fix: "Add a LICENSE file and set package.json \"license\".",
  },
  {
    name: "Operator identity and contact in the privacy notice",
    ok: operator !== null && Boolean(operator?.name && operator?.country && /@/.test(operator?.email ?? "")),
    fix: "Fill in config/operator.ts (name, country, privacy contact email).",
  },
  {
    name: "Nutrition values from an authoritative source",
    ok: /dataset: "SR Legacy"/.test(read("data/ingredients.ts")) && existsSync("docs/nutrition-sources.md"),
    fix: "Cite USDA FoodData Central (or another food-composition table) for every ingredient.",
  },
  {
    name: "Manual screen-reader pass recorded",
    ok: /\| (VoiceOver|TalkBack|NVDA)[^|]*\|[^|]*\|[^|]*\| (Pass|Passed)/i.test(accessibility),
    fix: "Run the checklist in docs/accessibility.md on VoiceOver, TalkBack, and NVDA and record the results.",
  },
  {
    name: "Dietitian review signed off",
    ok: /^\*\*Status:\*\* Approved/im.test(dietitian),
    fix: "Have a registered dietitian complete docs/dietitian-review.md and set its status to Approved.",
  },
  {
    name: "Installed and tested on real devices over HTTPS",
    ok: /\| (Android|iPhone|iOS)[^|]*\|[^|]*\| (Pass|Passed)/i.test(read("docs/device-testing.md")),
    fix: "Deploy over HTTPS, then record install/offline results in docs/device-testing.md.",
  },
];

const failing = checks.filter((check) => !check.ok);
for (const check of checks) console.log(`${check.ok ? "✓" : "✗"} ${check.name}${check.ok ? "" : `\n    → ${check.fix}`}`);
console.log(failing.length === 0 ? "\nReady for a public launch." : `\n${failing.length} item(s) still block a public launch.`);
process.exit(failing.length === 0 ? 0 : 1);
