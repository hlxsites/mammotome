# Flex-Carousel

The Flex-Carousel block creates a rotating carousel of slides, where each slide pairs an image with a block of text. The text side supports headings, paragraphs, bulleted lists, and buttons. The carousel advances automatically, pauses while the visitor hovers over it, and provides both arrow and dot navigation.

## Variations

The block is a **two-column** table. **Each row is one slide.** Within a row, one cell holds the image and the other holds the text.

The side the image appears on is controlled entirely by **which column you put it in** — there is no setting to configure:

- Image in the **left** column → image on the left, text on the right.
- Image in the **right** column → text on the left, image on the right.

You can mix both within a single carousel, alternating sides from slide to slide.

On phones and tablets, slides stack vertically and **the image always appears above the text**, whichever column it was authored in. You don't need a separate mobile arrangement.

### Narrow variation

By default the carousel spans up to 1200px. Adding the `narrow` variation to the block name constrains it to 800px:

| Flex-Carousel (narrow) |  |
| --- | --- |

### What goes in the text cell

The text cell is passed through as-is, so most standard authoring works:

| Content | Notes |
| --- | --- |
| Headings | H1, H2, and H3 are left-aligned |
| Paragraphs | Left-aligned |
| Bulleted lists | Styled with extra spacing between items |
| Links | Automatically rendered as buttons |

Buttons alternate colour by position: the first button is primary, the second is secondary, the third is primary again, and so on. On tablet and desktop they are centred; on mobile they align to the left. Buttons are capped at 300px wide, and long labels wrap onto a second line rather than being cut off.


## Content Structure


| Flex-Carousel |  |
| --- | --- |
| [image] | ## Precision You Can Trust<br>Consistent placement across every modality.<br>[Learn More](https://example.com/learn) |
| ### Designed for Confidence<br>Clear visibility at follow-up imaging.<br>[Schedule a Demo](https://example.com/demo) | [image] |

The first slide shows its image on the left. The second shows its image on the right.

## Behaviour notes

- **Automatic rotation.** Slides advance on their own and fade between one another. Rotation pauses whenever the visitor's cursor is over any part of the carousel, including the arrows, and resumes when they move away. With only one slide, nothing rotates.
- **Loads on scroll.** The carousel builds itself when it first scrolls into view rather than on page load, which keeps pages with a carousel low down from paying for it up front.
- **Navigation.** Arrows sit on either side, vertically centred. Dots sit below the slides. On mobile the dots are indicators only; from tablet upward they are clickable.