# Marker Quiz Block - Authoring Guide

The marker-quiz block now supports authoring through Excel documents, similar to the form block. This guide explains how to set up the authoring side for the product survey.

## Authoring Setup

### 1. Excel Document Structure

Create an Excel document with the following columns:

| Type | Id | Text | QuestionId | QuestionType | Layout | Scores | Image | Name | Description | Features | BestFor |
|------|----|------|------------|--------------|--------|--------|-------|------|-------------|----------|---------|
| config | ThankYouYes | Thank you for your interest! A sales representative will contact you within 24 hours. | | | | | | | | | |
| config | ThankYouNo | Thank you for taking our survey! We hope you found the product recommendation helpful. | | | | | | | | | |
| question | 1 | What is your primary goal? | | single | vertical | | | | | | |
| option | | Increase productivity | 1 | | | ProductA:3,ProductB:2 | | | | | |
| option | | Cost savings | 1 | | | ProductA:1,ProductB:3 | | | | | |
| product | ProductA | | | | | | | Enterprise Pro | Comprehensive solution | Feature1,Feature2 | Large enterprises |

### 2. Column Descriptions

#### For Config:
- **Type**: Must be "config"
- **Id**: Configuration identifier (ThankYouYes, ThankYouNo)
- **Text**: The message to display on thank you pages

#### For Questions:
- **Type**: Must be "question"
- **Id**: Unique identifier for the question
- **Text**: The question text to display
- **QuestionType**: Type of question (currently supports "single" and "multi")
- **Layout**: Optional layout for options ("vertical" or "horizontal"). Defaults to "vertical"

#### For Options:
- **Type**: Must be "option" or "other"
- **Text**: The option text to display
- **QuestionId**: Links to the question this option belongs to
- **Scores**: Comma-separated list of product scores (e.g., "ProductA:3,ProductB:2")
- **Image**: Optional image URL to display above the option text

#### For Products:
- **Type**: Must be "product"
- **Id**: Product identifier (used in scores)
- **Name**: Product name
- **Description**: Product description
- **Image**: URL to product image
- **Features**: Comma-separated list of features
- **BestFor**: Target audience description

### 3. JSON File Generation

The Excel document should be converted to JSON format. The JSON structure should be:

```json
{
  "data": [
    {
      "Type": "question",
      "Id": "1",
      "Text": "What is your primary goal?",
      "QuestionType": "single"
    },
    {
      "Type": "option",
      "Text": "Increase productivity",
      "QuestionId": "1",
      "Scores": "ProductA:3,ProductB:2"
    },
    {
      "Type": "product",
      "Id": "ProductA",
      "Name": "Enterprise Pro",
      "Description": "Comprehensive solution for large enterprises",
      "Image": "https://example.com/image.jpg",
      "Features": "Advanced analytics,24/7 support,Customization",
      "BestFor": "Large enterprises"
    }
  ]
}
```

### 4. Block Usage

In the authoring interface, add the marker-quiz block with a link to the JSON file:

```html
<div class="marker-quiz">
  <a href="https://main--mammotome--hlxsites.aem.page/surveys/product-survey.json">
    Product Survey Configuration
  </a>
</div>
```

## Example Excel Structure

Here's a complete example of how the Excel should be structured:

| Type | Id | Text | QuestionId | QuestionType | Layout | Scores | Image | Name | Description | Features | BestFor |
|------|----|------|------------|--------------|--------|--------|-------|------|-------------|----------|---------|
| question | 1 | What is your primary goal for this product? | | single | vertical | | | | | | |
| option | | Increase productivity | 1 | | | ProductA:3,ProductB:2,ProductC:1 | | | | | |
| option | | Cost savings | 1 | | | ProductA:1,ProductB:3,ProductC:2 | | | | | |
| option | | Improve user experience | 1 | | | ProductA:2,ProductB:1,ProductC:3 | | | | | |
| question | 2 | What is your company size? | | single | horizontal | | | | | | |
| option | | 1-10 employees | 2 | | | ProductA:1,ProductB:3,ProductC:2 | https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&h=150&fit=crop | | | | |
| option | | 11-50 employees | 2 | | | ProductA:2,ProductB:2,ProductC:3 | https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=200&h=150&fit=crop | | | | |
| option | | 51-200 employees | 2 | | | ProductA:3,ProductB:2,ProductC:2 | https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=200&h=150&fit=crop | | | | |
| product | ProductA | | | | | | | Enterprise Pro | Our most comprehensive solution for large enterprises | Advanced analytics,24/7 support,Highly customizable,On-premises deployment,Enterprise-grade security | Large enterprises with complex needs |
| product | ProductB | | | | | | | Business Starter | Perfect for small to medium businesses | Quick setup,Affordable pricing,Cloud-hosted solution,Basic reporting,Email support | Small to medium businesses |
| product | ProductC | | | | | | | Professional Plus | Ideal for growing companies | Moderate customization,Business hours support,Hybrid deployment,Comprehensive reporting,Mobile web access | Growing companies |

## Scoring System

The scoring system works as follows:

1. Each option has scores for different products
2. When a user selects an option, those scores are added to the respective products
3. The product with the highest total score is recommended
4. Scores can range from 1-10 (or any positive integer)

## Layout Options

The block supports two layout types for displaying question options:

### Vertical Layout (Default)
Options are stacked vertically, one below the other. This is ideal for:
- Questions with long option text
- Mobile-first designs
- Better readability with many options

### Horizontal Layout
Options are displayed side-by-side in a row. This is ideal for:
- Questions with short option text
- Visual comparison of options with images
- Creating a more compact design

**Note:** On mobile devices (screen width < 768px), horizontal layouts automatically convert to vertical for better usability.

## Image Support for Options

You can now add images to options by including an image URL in the **Image** column. Images will be displayed:
- Above the option text
- Automatically sized and constrained (max-height: 200px)
- With rounded corners for a modern look
- Contained within the option to maintain aspect ratio

**Best Practices for Images:**
- Use images of similar dimensions for consistent appearance
- Recommended size: 200-400px width, 150-300px height
- Use HTTPS URLs for security
- Consider using horizontal layout when all options have images
- Ensure images are optimized for web performance

## Fallback Behavior

If no JSON file is provided, the block will:
1. First try to use configuration data from the block
2. Finally fall back to default survey data

This ensures the block always works, even without authoring configuration.
