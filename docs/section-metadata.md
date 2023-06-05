# Section Metadata
Sections are a way to group default content and blocks by the author. Most of the time section breaks are introduced 
based on visual differences between sections such as a different background color for a part of a page.


# Usage

Section Metadata allows the author to add two parameters to a section table with the following attributes (1st column):

| Section Metadata |                             |
| ---------------- |-----------------------------|
| Style            | [see style options below]   |
| Divider          | [see divider options below] |

## Style

### Header and Text

| Header         | Default                                                | Style                                    |
|----------------|--------------------------------------------------------|------------------------------------------|
| H1             | font-size: 40px; font-weight: 400; line-height: 48px   | bold in word document (font-weight: 900) |
| H2             | font-size: 28.8px; font-weight: 400; line-height: 48px | bold in word document (font-weight: 900) |
| H3             | font-size: 20.8px; font-weight: 400; line-height: 48px | bold in word document (font-weight: 900) |
| H4             | font-size: 16px; font-weight: 400; line-height: 48px   | bold in word document (font-weight: 900) |
| alignment      | center                                                 | **align-left**                           |
| color          | black                                                  | **header-colored** (magenta)             |
| uppercase      | _as formatted in word document_                        | **header-uppercase**                     |
| letter-spacing | 0                                                      | **header-wide**                          |

| Text           | Default                             | Style                                                      |
|----------------|-------------------------------------|------------------------------------------------------------|
| text           | 16px;font-weight: 400;line-height:0 | **text-small** (12px, font-weight: 400, line-height: 24px) |
| alignment      | center                              | **align-left**                                             |
| letter spacing | 0                                   | **text-wide** (letter-spacing: 4px)                        |


### Background styles

#### Gradient primary blur overlay

#### Logo secondary background

#### arc top

#### callout

#### narrow

Narrow style puts the content in a section that is fixed to 610px.

![narrow-example.png](assets%2Fnarrow-example.png)

## Divider

Adds a divider before or after the section.

| Divider |                                |
|---------|--------------------------------|
| before  | add divider before the section | 
| after   | add divider after the section  |

### Example

| Section Metadata |       |
|------------------|-------|
| divider          | after |

![line-example.png](assets%2Fline-example.png)
