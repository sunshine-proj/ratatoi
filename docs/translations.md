# Translations

Protein Plate is available in English (the source), Latvian, Lithuanian, and Estonian. Everything a person sees is translated: interface text, the privacy notice, the 25 recipes (names, descriptions, steps, preparation notes, storage notes), ingredient names, units, and number and date formats.

## Review status

The Latvian, Lithuanian, and Estonian text was drafted by an AI assistant (Claude) and has **not yet been reviewed by native speakers**. Have each language reviewed before a public launch. When a review is done, set its row to `Approved`; `npm run launch:check` reads this table.

| Language | Interface | Recipes and ingredients | Reviewer | Date | Status |
|---|---|---|---|---|---|
| Latvian (lv) | `lib/i18n/messages/lv.ts` | `data/translations/lv/` | — | — | Pending |
| Lithuanian (lt) | `lib/i18n/messages/lt.ts` | `data/translations/lt/` | — | — | Pending |
| Estonian (et) | `lib/i18n/messages/et.ts` | `data/translations/et/` | — | — | Pending |

### What reviewers should check first

1. **Safety and legal text:** the privacy notice (`privacy.*`), the "not medical advice" footer, the targets disclaimer, and the notices about low calorie targets. These must stay as careful as the English.
2. **Allergen names:** the 14 allergens (`preferences.allergens.*`) should use the wording of EU Regulation 1169/2011, Annex II, in that language.
3. **The "high protein" claim:** the label rule (`recipes.tagRules.high_protein`) quotes the claim's official wording from Regulation 1924/2006 (lv "augsts olbaltumvielu saturs", lt "didelis baltymų kiekis", et "kõrge valgusisaldusega").
4. **Recipes:** cooking terms, and that each step means the same as the English.
5. **Ingredient names:** what the product is called on a supermarket shelf in that country, and the aliases people might type when searching or adding their own items.
6. **Tone:** warm, practical, and never shaming about food. The automated safety-copy test (`tests/unit/content/safety-copy.test.ts`) only covers English wording.

## Conventions

| | Latvian | Lithuanian | Estonian |
|---|---|---|---|
| Form of address | polite *jūs* (lowercase) | polite *jūs* (lowercase) | informal *sina* |
| Quotation marks | “…” | „…“ | „…“ |
| Numbers | `1900`, `12 500`, `2,5` | `1 900`, `2,5` | `1900`, `12 500`, `2,5` |
| Teaspoon / tablespoon | tējk. / ēdamk. | a. š. / v. š. | tl / sl |
| Pieces | gab. | vnt. | tk |
| Plural forms | zero, one, other | one, few, many, other | one, other |

Numbers, dates, and plural categories come from the browser's `Intl` data for `lv-LV`, `lt-LT`, and `et-EE`. Weekday and month names are capitalised at the start of a date.

**Inserted names stay in the nominative.** Baltic nouns change form with their role in a sentence, but recipe names, meal names, and dates are inserted as they are. Sentences that insert them use a label pattern instead of a sentence that would need another case, for example:

- English "Added Tuna and chickpea salad to lunch on Thursday 26 November." → Lithuanian "Pridėta: Tuno ir avinžirnių salotos (Lapkričio 26 d., ketvirtadienis, pietūs)."
- English "Swap Berry bowl" → Latvian "Aizstāt: Jogurta bļoda ar ogām"

**Counting pieces.** English writes "2 Lemons"; the other languages count with a unit ("2 gab.", "2 vnt.", "2 tk") or a counting word with the right plural ("3 skiltelės", "2 šķēles", "2 viilu"), because a bare number before a noun often needs a different noun form.

**Decimal commas.** In Latvian, Lithuanian, and Estonian forms a comma is always a decimal separator, so "1,25" kg is 1.25 kg. In English, "1,250" is read as one thousand two hundred and fifty.

## What isn't translated

- The name "Protein Plate".
- Text you type yourself: your own meals and shopping items, and ingredients to avoid.
- Repository documents, the licence, and code comments.

## Adding a language

1. Add the code to `locales`, `localeNames`, and `intlLocales` in `lib/i18n/index.ts`, and to `LOCALES` in `public/sw.js` (bump its `VERSION`).
2. Create `lib/i18n/messages/<code>.ts` typed as `Messages` (a missing key is a type error) and register it in `lib/i18n/catalogue.ts`. Add its error-page strings to `lib/i18n/messages/fatal-error.ts`.
3. Create `data/translations/<code>/ingredients.ts` and `recipes.ts`, and register them in `lib/ingredients/translations.ts` and `lib/recipes/translations.ts`.
4. Run `npm run test`. `tests/unit/i18n/` fails on missing keys, placeholders, plural forms, recipes, steps, notes, ingredients, and ingredient aliases that clash between languages.
5. Add a row to the review table above.
