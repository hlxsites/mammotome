# Hero Video Test Block - Word Document Example

## How to Create in Microsoft Word

### Step 1: Insert Table
1. Go to **Insert** → **Table**
2. Select **2 columns, 2 rows**

### Step 2: Fill the Table

#### Row 1 (Header):
- **Cell 1**: Type exactly: `Hero-video-test`
- **Cell 2**: Leave empty

#### Row 2 (Content):

**Column 1 (Video Content):**
```
https://player.vimeo.com/video/1127342102

[Insert Image: hero-poster.jpg]

[Insert Image: placeholder.jpg]
```

**Column 2 (Overlay Content):**
```
Neoprobe® Gamma Detection System

With over 20 years of excellence, the Neoprobe® GDS is dependable, simple, and accurate. 1,2

**Learn More**
https://player.vimeo.com/video/1127342102
```

## Visual Example

| Hero-video-test | |
|---|---|
| `https://player.vimeo.com/video/1127342102`<br><br>`[hero-poster.jpg]`<br><br>`[placeholder.jpg]` | `Neoprobe® Gamma Detection System`<br><br>`With over 20 years of excellence, the Neoprobe® GDS is dependable, simple, and accurate. 1,2`<br><br>`**Learn More**`<br>`https://player.video.com/video/1127342102` |

## Key Requirements

### ✅ Correct Structure:
- **2x2 table** (2 columns, 2 rows)
- **Block name**: Exactly "Hero-video-test" in first cell
- **Column 1**: Vimeo URL + optional images
- **Column 2**: Text content + CTA button with Vimeo URL

### ✅ Valid Vimeo URLs:
- `https://player.vimeo.com/video/123456789`
- `https://vimeo.com/123456789`
- `https://vimeo.com/video/123456789`

### ❌ Common Mistakes:
- Using 1 column instead of 2
- Wrong block name (e.g., "hero-video-test", "Hero Video Test")
- YouTube URLs instead of Vimeo
- Missing table structure
- No CTA button in second column

## Alternative Structure (Same Video for Both)

If you want the same video for background and modal:

| Hero-video-test | |
|---|---|
| `https://player.vimeo.com/video/1127342102`<br><br>`[hero-poster.jpg]` | `Neoprobe® Gamma Detection System`<br><br>`With over 20 years of excellence...`<br><br>`**Learn More**`<br>`https://player.video.com/video/1127342102` |

## Troubleshooting

### Console Error: "No overlay section found"
**Cause**: Table structure not detected properly
**Solution**: 
1. Ensure exactly 2 columns in table
2. Check block name spelling
3. Verify second column has content

### Console Error: "Invalid Vimeo URL"
**Cause**: URL format is incorrect
**Solution**: Use proper Vimeo URL format (see examples above)

### Video Not Playing
**Cause**: Vimeo URL doesn't exist or is private
**Solution**: Test URL in browser first, ensure video is public
