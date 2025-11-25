# Hero Video Test - Final Template for Your System

## ✅ CORRECT Word Document Structure

Since your AEM converts tables to divs, use this structure:

### Option 1: Two Separate Paragraphs (Recommended)

**Paragraph 1 (Video Content):**
```
https://player.vimeo.com/video/1127342102

[Insert your poster image here]

[Insert placeholder image here]
```

**Paragraph 2 (Overlay Content):**
```
Neoprobe® Gamma Detection System

With over 20 years of excellence, the Neoprobe® GDS is dependable, simple, and accurate. 1,2

Learn More
https://player.vimeo.com/video/1127342102
```

### Option 2: Single Paragraph with Line Breaks

```
https://player.vimeo.com/video/1127342102

[Insert your poster image here]

[Insert placeholder image here]

Neoprobe® Gamma Detection System

With over 20 years of excellence, the Neoprobe® GDS is dependable, simple, and accurate. 1,2

Learn More
https://player.vimeo.com/video/1127342102
```

## 🎯 Key Points:

1. **No table needed** - Your system converts everything to divs anyway
2. **Two Vimeo URLs required** - One for background, one for fullscreen modal
3. **Same URLs work** - You can use the same Vimeo URL for both
4. **Line breaks matter** - Use paragraph breaks to separate content sections

## 📝 Step-by-Step Instructions:

1. **Create a new paragraph** in Word
2. **Add the first Vimeo URL** (for background video)
3. **Press Enter** to create a new line
4. **Add your poster image** (optional)
5. **Press Enter** to create a new line
6. **Add placeholder image** (optional)
7. **Press Enter** to create a new line
8. **Add your heading text**
9. **Press Enter** to create a new line
10. **Add your description text**
11. **Press Enter** to create a new line
12. **Add "Learn More" text**
13. **Press Enter** to create a new line
14. **Add the second Vimeo URL** (for fullscreen modal)

## 🔧 The JavaScript Will:

- ✅ Find the first div (videoBanner) with the background Vimeo URL
- ✅ Find the second div (overlay) with the text content
- ✅ Look for the last `<a>` tag in the overlay for the fullscreen modal
- ✅ Create the background video from the first URL
- ✅ Create the "Learn More" button that opens the modal with the second URL

This should resolve the "No fullscreen video link found" warning!
