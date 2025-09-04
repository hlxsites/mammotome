# Marker Quiz Block - Authoring Guide

The marker-quiz block now supports authoring through Excel documents, similar to the form block. This guide explains how to set up the authoring side for the product survey.

## Authoring Setup

### 1. Excel Document Structure

Create an Excel document with the following columns:

| Type | Id | Text | QuestionId | QuestionType | Scores | Name | Description | Image | Features | BestFor |
|------|----|------|------------|--------------|--------|------|-------------|-------|----------|---------|
| config | ThankYouYes | Thank you for your interest! A sales representative will contact you within 24 hours. | | | | | | | | |
| config | ThankYouNo | Thank you for taking our survey! We hope you found the product recommendation helpful. | | | | | | | | |
| question | 1 | What is your primary goal? | | single | | | | | | |
| option | | Increase productivity | 1 | | ProductA:3,ProductB:2 | | | | | | |
| option | | Cost savings | 1 | | ProductA:1,ProductB:3 | | | | | | |
| product | ProductA | | | | | Enterprise Pro | Comprehensive solution | https://example.com/image.jpg | Feature1,Feature2 | Large enterprises |

### 2. Column Descriptions

#### For Config:
- **Type**: Must be "config"
- **Id**: Configuration identifier (ThankYouYes, ThankYouNo)
- **Text**: The message to display on thank you pages

#### For Questions:
- **Type**: Must be "question"
- **Id**: Unique identifier for the question
- **Text**: The question text to display
- **QuestionType**: Type of question (currently supports "single")

#### For Options:
- **Type**: Must be "option"
- **Text**: The option text to display
- **QuestionId**: Links to the question this option belongs to
- **Scores**: Comma-separated list of product scores (e.g., "ProductA:3,ProductB:2")

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

| Type | Id | Text | QuestionId | QuestionType | Scores | Name | Description | Image | Features | BestFor |
|------|----|------|------------|--------------|--------|------|-------------|-------|----------|---------|
| question | 1 | What is your primary goal for this product? | | single | | | | | | |
| option | | Increase productivity | 1 | | ProductA:3,ProductB:2,ProductC:1 | | | | | | |
| option | | Cost savings | 1 | | ProductA:1,ProductB:3,ProductC:2 | | | | | | |
| option | | Improve user experience | 1 | | ProductA:2,ProductB:1,ProductC:3 | | | | | | |
| question | 2 | What is your company size? | | single | | | | | | |
| option | | 1-10 employees | 2 | | ProductA:1,ProductB:3,ProductC:2 | | | | | | |
| option | | 11-50 employees | 2 | | ProductA:2,ProductB:2,ProductC:3 | | | | | | |
| option | | 51-200 employees | 2 | | ProductA:3,ProductB:2,ProductC:2 | | | | | | |
| product | ProductA | | | | | Enterprise Pro | Our most comprehensive solution for large enterprises | https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop | Advanced analytics,24/7 support,Highly customizable,On-premises deployment,Enterprise-grade security | Large enterprises with complex needs |
| product | ProductB | | | | | Business Starter | Perfect for small to medium businesses | https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop | Quick setup,Affordable pricing,Cloud-hosted solution,Basic reporting,Email support | Small to medium businesses |
| product | ProductC | | | | | Professional Plus | Ideal for growing companies | https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop | Moderate customization,Business hours support,Hybrid deployment,Comprehensive reporting,Mobile web access | Growing companies |

## Scoring System

The scoring system works as follows:

1. Each option has scores for different products
2. When a user selects an option, those scores are added to the respective products
3. The product with the highest total score is recommended
4. Scores can range from 1-10 (or any positive integer)

## Fallback Behavior

If no JSON file is provided, the block will:
1. First try to use configuration data from the block
2. Finally fall back to default survey data

This ensures the block always works, even without authoring configuration.
