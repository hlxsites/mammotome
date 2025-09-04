# Complete Excel Structure Example for Marker-Quiz Block

Here's how the Excel document should be structured to include the contact logic and thank you messages:

## Excel Structure

| Type | Id | Text | QuestionId | QuestionType | Scores | Name | Description | Image | Features | BestFor |
|------|----|------|------------|--------------|--------|------|-------------|-------|----------|---------|
| config | ThankYouYes | Thank you for your interest! A sales representative will contact you within 24 hours to discuss how our solution can meet your needs. | | | | | | | | |
| config | ThankYouNo | Thank you for taking our survey! We hope you found the product recommendation helpful. Feel free to reach out if you have any questions in the future. | | | | | | | | |
| question | 1 | What is your primary goal for this product? | | single | | | | | | |
| option | | Increase productivity | 1 | | ProductA:3,ProductB:2,ProductC:1,ProductD:2,ProductE:2,ProductF:1 | | | | | | |
| option | | Cost savings | 1 | | ProductA:1,ProductB:3,ProductC:2,ProductD:3,ProductE:3,ProductF:3 | | | | | | |
| option | | Improve user experience | 1 | | ProductA:2,ProductB:1,ProductC:3,ProductD:2,ProductE:2,ProductF:2 | | | | | | |
| option | | Scalability | 1 | | ProductA:3,ProductB:2,ProductC:2,ProductD:3,ProductE:3,ProductF:2 | | | | | | |
| question | 2 | What is your company size? | | single | | | | | | |
| option | | 1-10 employees | 2 | | ProductA:1,ProductB:3,ProductC:2,ProductD:1,ProductE:3,ProductF:2 | | | | | | |
| option | | 11-50 employees | 2 | | ProductA:2,ProductB:2,ProductC:3,ProductD:2,ProductE:3,ProductF:2 | | | | | | |
| option | | 51-200 employees | 2 | | ProductA:3,ProductB:2,ProductC:2,ProductD:3,ProductE:2,ProductF:3 | | | | | | |
| option | | 200+ employees | 2 | | ProductA:3,ProductB:1,ProductC:1,ProductD:3,ProductE:1,ProductF:3 | | | | | | |
| product | ProductA | | | | | Enterprise Pro | Our most comprehensive solution for large enterprises | https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop | Advanced analytics,24/7 support,Highly customizable,On-premises deployment,Enterprise-grade security | Large enterprises with complex needs |
| product | ProductB | | | | | Business Starter | Perfect for small to medium businesses | https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop | Quick setup,Affordable pricing,Cloud-hosted solution,Basic reporting,Email support | Small to medium businesses |

## Flow Explanation

1. **Survey Questions**: Users answer questions and get product recommendations
2. **Results Display**: Shows recommended product with features and description
3. **Contact Question**: "Would you like to be contacted by a sales rep to learn more?"
4. **If Yes**: Shows contact form with fields for name, email, phone, company, message
5. **If No**: Shows thank you message (ThankYouNo)
6. **After Form Submission**: Shows thank you message (ThankYouYes)

## Config Row Types

### ThankYouYes
- **Type**: config
- **Id**: ThankYouYes
- **Text**: Custom message shown after contact form submission

### ThankYouNo
- **Type**: config
- **Id**: ThankYouNo
- **Text**: Custom message shown when user declines contact

## Contact Form Fields

The contact form includes:
- First Name (required)
- Last Name (required)
- Email Address (required)
- Phone Number (optional)
- Company (optional)
- Additional Information (optional)

## Data Collection

When the contact form is submitted, the system collects:
- All form field data
- Recommended product from survey
- Complete survey answers
- Timestamp of submission

This data can be sent to your CRM, email system, or lead management platform.
