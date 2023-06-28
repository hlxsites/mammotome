# Hero

A Hero block on a webpage is a prominent and visually impactful section that usually appears at the top of the page. The hero block is so called **autoblock**. It is automatically created based on the composition of different variations with Headers, Subheaders and images. Depending on the order the Hero block is shown differently.

## Variations

The Hero block can be combined with Section Metadata for example to add a blur overlay. See [Section Metadata](../section-metadata.md) for more information.

### Hero with background image text and button (link)

![hero-image-button-example.png](../assets/hero-image-button-example.png)

#### Structure

```
[IMAGE]   
[H2]   
[LINK]
```

_Optional:_

| Section Metadata |                               |
|------------------|-------------------------------|
| Style            | gradient primary blur overlay |

### Image with header

![hero-image-header-example.png](../assets/hero-image-header-example.png)

#### Structure

```
[IMAGE]
[H1]
```

### Image with header and subheader

![hero-image-header-suheader-example.png](../assets/hero-image-header-suheader-example.png)

#### Structure

```
[IMAGE]
[H1]
[H2]
```

### Image with colored background, header and subheader

![hero-image-colored-background-header-suheader-example.png](../assets/hero-image-colored-background-header-suheader-example.png)

#### Structure

```
[H1]
[H2]
[IMAGE]
```

### Image with floating image and header

![hero-image-floating-image-header-example.png](../assets/hero-image-floating-image-header-example.png)

#### Structure

```
[IMAGE]
[FLOATING IMAGE]
[H2]
```
