# Hero-Autoplay

The Hero-Autoplay block creates a full-width hero banner with a looping, muted Vimeo video playing in the background, overlaid with a heading, subheading, and call-to-action buttons. Optionally, a play icon can be shown that opens a larger version of the video (with sound) in a full-screen modal overlay.

## Variations

The block is a **single-column** table. The block name goes in the first row, and all of the content goes in the cell(s) below it. The block reads the content by type — not by position — so the order in which you add items is what matters:

| hero-autoplay |
| :---        |
| [preview video]      |
| [video]   |
| [H1]   |
| [H2]   |
| [button]   |


1. **Preview video (required).** The first Vimeo link is used as the muted, looping background video that autoplays behind the copy.
2. **Video (optional).** The second Vimeo link, if present, enables a play icon. Clicking it opens this video full-screen, with sound, in an overlay.

Notes for authors:

- The **first** Vimeo link is always the background; the **second** is always the modal. Order them accordingly.
- You may prefix each Vimeo link with a plain-text label (e.g. `Preview:` or `Video:`) so it's easy to tell them apart while authoring. The block automatically hides these labels when the page renders.
- Both regular Vimeo URLs (`vimeo.com/{id}`) and player URLs (`player.vimeo.com/video/{id}`) are accepted — they're normalized automatically.
- If **no preview link** is provided, the block renders nothing. The preview video is what makes the hero appear.
- If you provide only a preview link (no modal link), the hero still works — it just won't show a play icon.

## Content Structure

This block is just one column. Here's an example below:

| Hero-Autoplay |
| --- |
| Preview: https://vimeo.com/123456789 |
| Video: https://vimeo.com/987654321 |
| # Breast Biopsy Course |
| ## Join us for a complimentary, physician-led course with didactic lectures and hands-on skills labs covering a wide range of topics in the biopsy suite. |
| [Learn More](https://example.com/course) |
| [Schedule a Demo](https://example.com/demo) |