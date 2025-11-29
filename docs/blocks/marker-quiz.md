# Marker Quiz Block - Product Survey

The Marker Quiz block has been enhanced to include a comprehensive product survey functionality that consolidates all components from the product-survey-app. This block now supports authoring capabilities similar to the form block, allowing content authors to customize questions, options, and product recommendations.

## Features

- **Interactive Survey**: Multi-question survey with progress tracking
- **Product Recommendations**: Algorithm-based product matching based on user responses
- **Authoring Support**: Configurable questions and products through block configuration
- **Responsive Design**: Mobile-friendly interface
- **Modern UI**: Beautiful gradient design with smooth animations

## Usage

### Basic Usage

Simply add the marker-quiz block to your page:

```html
<div class="marker-quiz">
  <!-- Block will render with default survey data -->
</div>
```

### Advanced Usage with Authoring

You can customize the survey by providing configuration data:

```html
<div class="marker-quiz">
  <script type="application/json">
    {
      "surveyData": {
        "questions": [
          {
            "id": 1,
            "text": "What is your primary goal?",
            "type": "single",
            "options": [
              {
                "text": "Increase productivity",
                "scores": { "ProductA": 3, "ProductB": 2 }
              },
              {
                "text": "Cost savings",
                "scores": { "ProductA": 1, "ProductB": 3 }
              }
            ]
          }
        ],
        "products": {
                     "ProductA": {
             "name": "Enterprise Pro",
             "description": "Comprehensive solution for large enterprises",
             "image": "https://example.com/image.jpg",
             "features": ["Feature 1", "Feature 2"],
             "bestFor": "Large enterprises"
           },
                     "ProductB": {
             "name": "Business Starter",
             "description": "Affordable solution for small businesses",
             "image": "https://example.com/image2.jpg",
             "features": ["Feature 1", "Feature 2"],
             "bestFor": "Small businesses"
           }
        }
      }
    }
  </script>
</div>
```

## Configuration Options

### Block Configuration

The marker-quiz block can be configured using block metadata:

| Property | Description | Example |
|----------|-------------|---------|
| `Marketo Form ID` or `marketoformid` | The Marketo form ID to embed in the contact form | `1234` |

Example in document:

```
| marker-quiz |  |
|-------------|--|
| Marketo Form ID | 1234 |
```

### Survey Data Structure

The `surveyData` object contains:

#### Questions Array
Each question object has:
- `id`: Unique identifier
- `text`: Question text
- `type`: Question type (currently supports "single")
- `options`: Array of answer options

#### Options Array
Each option has:
- `text`: Option text
- `scores`: Object mapping product IDs to score values

#### Products Object
Each product has:
- `name`: Product name
- `description`: Product description
- `image`: Product image URL
- `features`: Array of product features
- `bestFor`: Target audience

## Scoring Algorithm

The survey uses a scoring system where:
1. Each answer option has scores for different products
2. User responses accumulate scores for each product
3. The product with the highest total score is recommended

## Contact Form Integration

When a user completes the survey and is interested in the recommended product, they can proceed to a contact form. The block supports embedding Marketo forms for lead capture:

### Setup

1. Create a Marketo form with the necessary fields (FirstName, LastName, Email, Phone, Company, Comments/Message)
2. Add the Marketo Form ID to the block configuration (see Block Configuration above)
3. The form will automatically be embedded and handle submission

### Form Submission Flow

1. User completes the survey and clicks "Yes, I'm interested!"
2. Marketo form is displayed with the contact information fields
3. Upon submission:
   - Form data is captured
   - Quiz results and contact information are submitted to the backend
   - User sees a thank you message
   - Marketo can trigger follow-up workflows

### Required Configuration

The block requires a Marketo Form ID to be configured. If no form ID is provided, an error message will be displayed instead of the form.

## Default Survey

If no configuration is provided, the block uses a default survey with:
- 2 sample questions
- 2 sample products (Enterprise Pro and Business Starter)
- Basic scoring system

## Styling

The block includes comprehensive CSS styling with:
- Modern gradient design
- Smooth animations and transitions
- Responsive layout
- Hover effects
- Progress indicators

## Browser Support

- Modern browsers with ES6+ support
- Mobile responsive design
- Touch-friendly interface

## Integration

This block integrates seamlessly with the existing Franklin framework and follows the same patterns as other blocks in the codebase.
