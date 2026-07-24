# Marker-App

The Marker-App block renders the "Meet Your Match" marker recommendation quiz: a start screen, a series of questions, and a results screen with recommended products, email-results and contact-sales forms, and social sharing.

Unlike most blocks, **the questions, answer options, and scoring logic live in the code, not in the document.** Authors do not write the quiz. What the author controls is the configuration around it: which product data file to load, the start screen wording, images attached to specific questions, which questions to hide, which forms to use, per-product results disclaimers, and the text prefilled into the social "share your results" buttons.

## Variations

The block is a **two-column** table of name/value pairs. The left column is the setting name; the right column is the value. Rows can appear in any order, and any row you leave out falls back to a sensible default.

Setting names are case- and punctuation-insensitive — `Start Title`, `start-title`, and `Start title` all work.

### Product data

| Setting | Value |
| --- | --- |
| `json-file` | URL of the JSON file containing the marker product data |

You can also simply place the `.json` URL in the block without a label — the block scans every row for a URL ending in `.json` and uses the first one it finds. The labelled row is clearer, though, and takes priority.

### Start screen

| Setting | Value | Default if omitted |
| --- | --- | --- |
| `start-title` | Headline on the start screen. Rich text and multiple lines are supported. | "Meet Your Match" |
| `start-description` | Supporting paragraph under the headline. | "Take our quick quiz to discover the solution that best aligns with your patient and clinical needs." |
| `start-button` | Label on the button that begins the quiz. | "Start Quiz" |
| `estimated-time` | Duration shown under the button, e.g. `3 minutes`. Renders as "Estimated time: 5 minutes". | Not shown at all |
| `start-window` | Vimeo or YouTube URL used as a muted, looping background video on the start screen. | No background video |
| `sub-header` | An image and/or a line of text shown as a sub-header. Put both in the same cell. | Not shown |

Notes:

- `start-title` accepts formatting, so you can bold or emphasize part of the headline and it will carry through.
- `start-window` accepts a normal Vimeo page URL (`vimeo.com/123456789`), a Vimeo player URL, or a YouTube URL. Only Vimeo and YouTube are permitted — any other host is ignored and no background appears. The autoplay, mute, and loop settings are applied automatically.
- `sub-header` can hold an image, text, or both. If you supply both, put the image and the text as separate lines in the one cell.

### Forms

| Setting | Value | Default if omitted |
| --- | --- | --- |
| `email-results-form-id` | Marketo form ID | Email results form is unavailable |
| `contact-sales-form-id` | Marketo form ID | `2695` |

### Results disclaimers (per product)

Authors can add disclaimer lines that appear **below the Product Features list** on the results screen for a specific recommended product. Each disclaimer is a two-column row:

| Product id | Disclaimer text |
| --- | --- |
| `hmplus` | \*Add a new row of content here. |

Add as many rows as you need. Rows that share the same product id all appear, in the order authored.

Valid product ids (aliases in parentheses also work):

| Id | Product |
| --- | --- |
| `hm` | HydroMARK (`hydromark`) |
| `hmplus` | HydroMARK Plus (`hydromark-plus`) |
| `mammomark` | MammoMARK & CorMARK (`cormark`) |
| `mammostar` | MammoSTAR |
| `lumimark` | LumiMARK |
| `biomarc` | BiomarC |

Basic formatting in the text cell (italics, links, superscripts) is preserved. If the top recommendation is a different product, that product's disclaimer rows are shown instead — other products' rows stay hidden.

Optional labelled form (three columns) if you prefer an explicit setting name:

| Setting | Product id | Text |
| --- | --- | --- |
| `Disclaimer` | `hmplus` | \*Add a new row of content here. |

### Social share text

| Setting | Value | Default if omitted |
| --- | --- | --- |
| `share-text` | The message prefilled when a visitor shares their results on LinkedIn | The standard #MarkerMatch copy below |

The results screen has a "Share Your #MarkerMatch" section with a LinkedIn button. The quiz page URL is appended automatically, so don't include a link in the text.

Each paragraph (line) you write in the cell becomes its own paragraph in the share message, separated by a blank line. Formatting like bold or italics is dropped — only the plain text is used.

If the row is omitted or left empty, this default is used:

> I found my #MarkerMatch with the Mammotome Meet Your Match Quiz!
>
> Find out which Mammotome marker is your match.
>
> Take the quiz to discover the marker that aligns with your patient and clinical needs, then share your results.
>
> #MarkerMatch #MammotomeMarkers #BreastBiopsy

Example row:

| Setting | Value |
| --- | --- |
| `share-text` | I just took the Meet Your Match quiz — find out which marker fits your practice! #MarkerMatch |

### Hiding things

| Setting | Value |
| --- | --- |
| `hide` | A list of things to hide, separated by spaces, commas, semicolons, or pipes |

The `hide` row does two different jobs depending on what you put in it:

- **`nav` and `footer`** hide the site header and site footer, which is how you make the quiz run as a full-screen experience.
- **Any other word or phrase** is treated as a question filter. The block hides any question whose prompt *contains* that text (case-insensitive), and removes it from scoring entirely.

Because question filters are substring matches, wrap multi-word phrases in quotes so they're treated as one filter:

| hide | nav, footer, "hemostatic properties" |
| --- | --- |

That hides the site chrome and removes the hemostatic question from the quiz. Curly quotes pasted from Word or Excel are handled automatically.

Use the shortest phrase that uniquely identifies the question. A filter of `marker` would match nearly every question and empty the quiz.

## Question images

Questions are numbered **1 through 9**, matching the fixed question list below. These numbers are stable — they do not shift if you hide a question with the `hide` row.

| # | Question |
| --- | --- |
| 1 | Which biopsy site markers do you currently use? |
| 2 | What modality would you like to explore first? |
| 3 | Rank these features by importance to your practice |
| 4 | What specific patient case considerations impact your biopsy marker choice? |
| 5 | At follow-up imaging, what is your biggest concern about a previously placed marker? (Not used.)|
| 6 | How often would you use a marker with hemostatic properties? |
| 7 | Which best describes your biopsy case mix? (Not used.)|
| 8 | Do you prefer a marker with long-term ultrasound visibility and without a resorbable component? |
| 9 | How frequently do your patients express the following preferences or needs? |

### One image beside a question

| Setting | Value |
| --- | --- |
| `Question 4` | An image, plus optionally the word `left` or `right` on its own line |

The word sets which side of the options the image sits on. If you omit it, the image appears on the left.

### Images on the ranking options (Question 3)

Question 3 is the drag-to-reorder ranking question, and each of its options can carry up to **four** images. There are two ways to target an option:

**By keyword** — matches any option whose text contains the phrase. This is the safer method, because it keeps working if the options are reordered.

| Setting | Value |
| --- | --- |
| `Question 3 - Ease of Locating` | Up to 4 images |

The four ranking options are: `Long-term Ultrasound Visibility`, `Migration from Deployment Site`, `Ease of Locating`, and `Affordability`.

**By position** — targets the first, second, third, or fourth option as listed.

| Setting | Value |
| --- | --- |
| `Question 3 Option 2` | Up to 4 images |

If both a keyword and a position rule could apply to the same option, the keyword rule wins. Only the first four images in a cell are used; any beyond that are ignored.

## Content Structure

The table requires two columns and at least one row. The first row is the block name.

| Marker-App |  |
| --- | --- |
| json-file | https://www.example.com/marker-data.json |
| start-title | Meet Your Match |
| start-description | Take our quick quiz to discover the solution that best aligns with your patient and clinical needs. |
| start-button | Start Quiz |
| estimated-time | 3 minutes |
| hide | nav, footer |

## Examples

**Minimal**

Only the product data is genuinely required. Everything else falls back to defaults.

| Marker-App |  |
| --- | --- |
| json-file | https://www.example.com/marker-data.json |

**Typical landing page**

Full-screen quiz with a video background, custom wording, and both Marketo forms wired up.

| Marker-App |  |
| --- | --- |
| json-file | https://www.example.com/marker-data.json |
| start-title | Meet Your Match |
| start-description | Take our quick quiz to discover the solution that best aligns with your patient and clinical needs. |
| start-button | Start Quiz |
| estimated-time | 3 minutes |
| start-window | https://vimeo.com/123456789 |
| email-results-form-id | 2841 |
| contact-sales-form-id | 2695 |
| share-text | I found my #MarkerMatch with the Mammotome Meet Your Match Quiz! #MarkerMatch |
| hmplus | *Visibility claims based on clinical evaluation. |
| hmplus | *Not available in all markets. |
| hide | nav, footer |

**With images and a hidden question**

| Marker-App |  |
| --- | --- |
| json-file | https://www.example.com/marker-data.json |
| sub-header | [logo image] Marker Match |
| Question 4 | [image] right |
| Question 3 - Ease of Locating | [image] [image] [image] [image] |
| Question 3 - Affordability | [image] [image] |
| hide | nav, footer, "hemostatic properties" |

## Preview mode

Adding `?preview` to the page URL skips the quiz and renders the results screen directly, which is useful for checking the results layout without answering nine questions each time.

- `?preview` on its own shows the first product alphabetically.
- `?preview=product-slug` shows that specific product.

Results generated in preview mode are marked as preview data and are not counted as real submissions.

## Troubleshooting

**The quiz doesn't load or shows no products.** The product data JSON is missing or unreachable. Check that the `json-file` row is present and that the URL ends in `.json`.

**The start screen background video doesn't appear.** Only Vimeo and YouTube URLs are accepted. Any other host is silently ignored. Also confirm the video is public.

**A question image doesn't show up.** Check the question number against the table above, and confirm the label is exactly `Question 4` — a label like `Question 4 Image` won't match.

**The whole quiz disappeared after editing the `hide` row.** A `hide` term is matching more question prompts than intended. Remember it is a substring match, so a broad word like `marker` will match almost everything. Use a longer, quoted phrase.

**The share buttons still post the default text.** Check the label is exactly `share-text` (or `Share Text` — capitalization and punctuation don't matter) and that the value cell isn't empty. A cell containing only formatting or an image counts as empty, and the default copy is used instead.

**A results disclaimer doesn't show.** Confirm the left cell is a known product id (`hm`, `hmplus`, `mammomark`, `mammostar`, `lumimark`, or `biomarc`) and that you're previewing/receiving that product as the top recommendation. Disclaimers for other products are intentionally hidden.

**Site header and footer are still visible.** The `hide` row must contain the words `nav` and `footer` specifically. Other wording, such as `header` or `menu`, is treated as a question filter instead.
