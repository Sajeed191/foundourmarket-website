# Realme Narzo 20 Rendering Bisect Protocol

No root cause is accepted until the same Realme Narzo 20 proves this sequence for one property or one component:

1. Feature ON: reproduce corruption.
2. Disable exactly one listed property/component.
3. Feature OFF: verify corruption disappears.
4. Re-enable the same property/component.
5. Feature ON again: verify corruption returns.

Use `?debug=1` and the **Realme A/B bisect — one property only** section. Do not turn off multiple debug flags during a property test.

## Required report row per test

| property | component | file | line | corruption before | screenshot before | corruption after disable | screenshot after | corruption after re-enable | screenshot return |
|---|---|---:|---:|---|---|---|---|---|---|
|  |  |  |  | yes/no | phone photo | yes/no | phone photo | yes/no | phone photo |

## Current one-property candidates in the harness

| property | component | file | line | enabled value | disabled value |
|---|---|---:|---:|---|---|
| overflow | ProductCard | `src/components/site/ProductCard.tsx` | 309 | hidden | visible |
| overflow | AdaptiveProductMedia | `src/components/site/AdaptiveProductMedia.tsx` | 36 | hidden | visible |
| overflow | ProductCard title | `src/components/site/ProductCard.tsx` | 70 | hidden | visible |
| content-visibility | VirtualizedProductGrid card frame | `src/styles.css` | 1080 | auto | visible |
| contain | VirtualizedProductGrid card frame | `src/styles.css` | 1082 | layout paint style | none |
| isolation | VirtualizedProductGrid card frame | `src/styles.css` | 1083 | isolate | auto |
| contain | ProductCard shell | `src/styles.css` | 1091 | layout paint style | none |
| isolation | ProductCard shell | `src/styles.css` | 1092 | isolate | auto |
| contain | AdaptiveProductMedia | `src/styles.css` | 1096 | layout paint style | none |
| isolation | AdaptiveProductMedia | `src/styles.css` | 1097 | isolate | auto |
| transition | ProductImage | `src/components/site/AdaptiveProductMedia.tsx` | 61 | transform/opacity 300ms | none |
| srcSet | ProductImage | `src/components/site/ProductImage.tsx` | 187 | responsive srcSet | undefined |
| loading | ProductImage | `src/components/site/ProductImage.tsx` | 192 | lazy | eager |
| decoding | ProductImage | `src/components/site/ProductImage.tsx` | 194 | async | sync |

## Stop rule

Only declare root cause when exactly one row has this pattern:

`before = corruption YES`, `after disable = corruption NO`, `after re-enable = corruption YES`.

All other rows remain rejected, not “likely”.