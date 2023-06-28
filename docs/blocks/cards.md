## Cards

### Content Structure

Each card is represented with a row in a table. Cells in the left column are used for card images.

The card text is defined in the right column's cell, consisting of three sections. The first section is for the card title. The second section is used to give more info about the content represented with the card. The last section is used to define a link.

Usually, one of the heading styles can be used for card titles, but if that is not the case, then the first paragraph will be treated as a card title.

In the card body, **bold** and *italic* stiles can be used.

![cards-block.png](..%2Fassets%2Fcards-block.png)

### Variations

The card text is defined in the right column's cell, consisting of three sections. The first section is for the card title. The second section is used to give more info about the content represented with the card. The last section is used to define a link.

- `two-columns`
- `three-columns`
- `four-columns`

If an image you want that it occupies the whole width of the card, use the selector `wideimage`.

If you want an image to be displayed fully, use the selector `fullimage`. In this case, the image won't be cropped, but the height will be restricted to 120 pixels.

### Card link

As mentioned before, the card link is defined as the third section in the right cell. When you insert a link in the SharePoint document, you can specify a text that will be displayed on the card (a callout message that appears at the bottom of the card) and a link itself.

If you omit to provide link text, the card will be rendered without a callout message. In any case, the whole card will be clickable.

### Example
![cards-example.png](..%2Fassets%2Fcards-example.png)
