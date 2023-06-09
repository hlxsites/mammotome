# Section Metadata

Sections are a way to group default content and blocks by the author. Most of the time section breaks are introduced
based on visual differences between sections such as a different background color for a part of a page.

# Usage

A Section is represented by a leading `---` and a trailing `---`. The Section Metadata Table is being added at the end of the section.
Section Metadata allows the author to add two parameters to a section table with the following attributes (1st column)

`---`

| Section Metadata |                             |
| ---------------- | --------------------------- |
| Style            | [see style options below]   |
| Divider          | [see divider options below] |

`---`


## Style

### Header


| Attribute                       | Feature        | Default                                               | Style                       |
| ------------------------------- | -------------- | ----------------------------------------------------- | --------------------------- |
| _as formatted in word document_ | H1             | font-size: 40px; font-weight: 400; line-height: 1.2   | bold: font-weight: 900      |
| _as formatted in word document_ | H2             | font-size: 28.8px; font-weight: 400; line-height: 1.2 | bold: font-weight: 900      |
| _as formatted in word document_ | H3             | font-size: 20.8px; font-weight: 400; line-height: 1.2 | bold: font-weight: 900      |
| _as formatted in word document_ | H4             | font-size: 16px; font-weight: 400; line-height: 1.2   | bold: font-weight: 900      |
| **align-left**                  | alignment      | center                                                | left aligns  headline       |
| **header-colored**              | color          | black                                                 | color: magenta              |
| **header-uppercase**            | uppercase      | _as formatted in word document_                       | enforces uppercase          |
| **header-wide**                 | letter-spacing | 0                                                     | 4px spacing between letters |

### Text


| Attribute      | Feature                  | Default                                        | Style                                     |
| -------------- | ------------------------ | ---------------------------------------------- | ----------------------------------------- |
| **text-small** | text                     | font-size: 16px;font-weight: 400;line-height:0 | 12px, font-weight: 400, line-height: 24px |
| **align-left** | alignment                | center                                         |                                           |
| **text-wide**  | letter spacing           | 0                                              | 4px spacing between letters               |
| **attached**   | spacing between sections | 5%                                             | attach text to the previous section       |

### Background styles

#### Logo Primary background

Adds a magenta background to the section with small Mammotome logos. 

**Note:** the arc at the top will be generated with `arc top` style. see below... 

Example:

| Section Metadata |                         |
|------------------|-------------------------|
| Style            | logo primary background |

![logo-primary-background-example.png](assets%2Flogo-primary-background-example.png)


#### Logo secondary background

Adds a light background to the section with small Mammotome logos.

Example:

| Section Metadata |                           |
|------------------|---------------------------|
| Style            | logo secondary background |

![logo-secondary-background-example.png](assets%2Flogo-secondary-background-example.png)

#### Accent Primary solid background

Adds a solid background to the section. The background color is the primary color.

Example:

| Section Metadata |                                 |
|------------------|---------------------------------|
| Style            | Accent primary solid background |

![accent-primary-solid-background-example.png](assets%2Faccent-primary-solid-background-example.png)

#### Accent quinary solid background

#### Base primary blur overlay

#### Base secondary blur overlay

#### Gradient primary blur overlay

Adds a gradient overlay to the section. The gradient is a linear gradient from top to bottom. The gradient is a mix of the primary and secondary color.

Example:

| Section Metadata |                               |
|------------------|-------------------------------|
| Style            | gradient primary blur overlay |

![gradient-primary-blur-overlay-example.png](assets%2Fgradient-primary-blur-overlay-example.png)



#### Gradient secondary blur overlay

#### Arc top

Adds an arc at the top of the section. The arc top is being used in combindation with a background style. See above


Example:

| Section Metadata |         |
|------------------|---------|
| Style            | arc top |

![logo-primary-background-example.png](assets%2Flogo-primary-background-example.png)

#### Callout

#### Narrow

* **narrow**: Some Paragraphs are fixed at a certain width to make them easier to read. The **narrow** style is used for this purpose.

Narrow style puts the content in a section that is fixed to **610px**.

![narrow-example.png](assets%2Fnarrow-example.png)

## Divider

Adds a divider before or after the section.


| Divider |                                |
| ------- | ------------------------------ |
| before  | add divider before the section |
| after   | add divider after the section  |

### Example


| Section Metadata |       |
| ---------------- | ----- |
| divider          | after |

....produce →

![line-example.png](assets%2Fline-example.png)
