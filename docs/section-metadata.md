# Section Metadata
Sections are a way to group default content and blocks by the author. Most of the time section breaks are introduced 
based on visual differences between sections such as a different background color for a part of a page.


# Usage

Section Metadata allows the author to add two parameters to a section table with the following attributes (1st column):

| Section Metadata |                             |
|------------------|-----------------------------|
| Style            | [see style options below]   |
| Divider          | [see divider options below] |

## Style

### Header

| Attribute                       | Feature        | Default                                                | Style                       |
|---------------------------------|----------------|--------------------------------------------------------|-----------------------------|
| _as formatted in word document_ | H1             | font-size: 40px; font-weight: 400; line-height: 48px   | font-weight: 900            |
| _as formatted in word document_ | H2             | font-size: 28.8px; font-weight: 400; line-height: 48px | font-weight: 900            |
| _as formatted in word document_ | H3             | font-size: 20.8px; font-weight: 400; line-height: 48px | font-weight: 900            |
| _as formatted in word document_ | H4             | font-size: 16px; font-weight: 400; line-height: 48px   | font-weight: 900            |
| **align-left**                  | alignment      | center                                                 | left aligns the headline    |
| **header-colored**              | color          | black                                                  | color: magenta              |
| **header-uppercase**            | uppercase      | _as formatted in word document_                        | enforces uppercase          |
| **header-wide**                 | letter-spacing | 0                                                      | add spacing between letters |


### Text

| Attribute      | Feature                  | Default                             | Style                                     |
|----------------|--------------------------|-------------------------------------|-------------------------------------------|
| **text-small** | text                     | 16px;font-weight: 400;line-height:0 | 12px, font-weight: 400, line-height: 24px |
| **align-left** | alignment                | center                              |                                           |
| **text-wide**  | letter spacing           | 0                                   | letter-spacing: 4px                       |
| **attached**   | spacing between sections | 5%                                  | attach text to the previous section       |

### Background styles

#### Gradient primary blur overlay

#### Logo secondary background

#### arc top

#### callout

#### narrow

* **narrow**: Some Paragraphs are fixed at a certain width to make them easier to read. The **narrow** style is used for this purpose.

Narrow style puts the content in a section that is fixed to **610px**.

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

....produce →

![line-example.png](assets%2Fline-example.png)
