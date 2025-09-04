#!/usr/bin/env python3
"""
Convert Product Survey App data to Excel format for marker-quiz block
"""

import xlsxwriter

def create_survey_excel():
    # Create workbook and worksheet
    workbook = xlsxwriter.Workbook('product-survey-data.xlsx')
    worksheet = workbook.add_worksheet('Survey Data')
    
    # Define formats
    header_format = workbook.add_format({
        'bold': True,
        'bg_color': '#667eea',
        'font_color': 'white',
        'border': 1,
        'align': 'center'
    })
    
    question_format = workbook.add_format({
        'bg_color': '#f0f8ff',
        'border': 1
    })
    
    option_format = workbook.add_format({
        'bg_color': '#f8f9fa',
        'border': 1
    })
    
    product_format = workbook.add_format({
        'bg_color': '#e8f5e8',
        'border': 1
    })
    
    # Define headers
    headers = [
        'Type', 'Id', 'Text', 'QuestionId', 'QuestionType', 'Scores',
        'Name', 'Description', 'Image', 'Features', 'BestFor'
    ]
    
    # Write headers
    for col, header in enumerate(headers):
        worksheet.write(0, col, header, header_format)
    
    # Survey data from product-survey-app
    survey_data = {
        'questions': [
            {
                'id': 1,
                'text': "What is your primary goal for this product?",
                'type': "single",
                'options': [
                    {'text': "Increase productivity", 'scores': {"ProductA": 3, "ProductB": 2, "ProductC": 1, "ProductD": 2, "ProductE": 2, "ProductF": 1}},
                    {'text': "Cost savings", 'scores': {"ProductA": 1, "ProductB": 3, "ProductC": 2, "ProductD": 3, "ProductE": 3, "ProductF": 3}},
                    {'text': "Improve user experience", 'scores': {"ProductA": 2, "ProductB": 1, "ProductC": 3, "ProductD": 2, "ProductE": 2, "ProductF": 2}},
                    {'text': "Scalability", 'scores': {"ProductA": 3, "ProductB": 2, "ProductC": 2, "ProductD": 3, "ProductE": 3, "ProductF": 2}}
                ]
            },
            {
                'id': 2,
                'text': "What is your company size?",
                'type': "single",
                'options': [
                    {'text': "1-10 employees", 'scores': {"ProductA": 1, "ProductB": 3, "ProductC": 2, "ProductD": 1, "ProductE": 3, "ProductF": 2}},
                    {'text': "11-50 employees", 'scores': {"ProductA": 2, "ProductB": 2, "ProductC": 3, "ProductD": 2, "ProductE": 3, "ProductF": 2}},
                    {'text': "51-200 employees", 'scores': {"ProductA": 3, "ProductB": 2, "ProductC": 2, "ProductD": 3, "ProductE": 2, "ProductF": 3}},
                    {'text': "200+ employees", 'scores': {"ProductA": 3, "ProductB": 1, "ProductC": 1, "ProductD": 3, "ProductE": 1, "ProductF": 3}}
                ]
            },
            {
                'id': 3,
                'text': "What is your budget range?",
                'type': "single",
                'options': [
                    {'text': "Under $1,000", 'scores': {"ProductA": 1, "ProductB": 3, "ProductC": 2, "ProductD": 1, "ProductE": 2, "ProductF": 1}},
                    {'text': "$1,000 - $5,000", 'scores': {"ProductA": 2, "ProductB": 2, "ProductC": 3, "ProductD": 2, "ProductE": 3, "ProductF": 2}},
                    {'text': "$5,000 - $20,000", 'scores': {"ProductA": 3, "ProductB": 2, "ProductC": 2, "ProductD": 3, "ProductE": 2, "ProductF": 3}},
                    {'text': "$20,000+", 'scores': {"ProductA": 3, "ProductB": 1, "ProductC": 1, "ProductD": 3, "ProductE": 1, "ProductF": 2}}
                ]
            },
            {
                'id': 4,
                'text': "How quickly do you need implementation?",
                'type': "single",
                'options': [
                    {'text': "Immediately (within 1 week)", 'scores': {"ProductA": 1, "ProductB": 3, "ProductC": 2, "ProductD": 1, "ProductE": 3, "ProductF": 1}},
                    {'text': "Within 1 month", 'scores': {"ProductA": 2, "ProductB": 2, "ProductC": 3, "ProductD": 2, "ProductE": 3, "ProductF": 2}},
                    {'text': "Within 3 months", 'scores': {"ProductA": 3, "ProductB": 2, "ProductC": 2, "ProductD": 3, "ProductE": 2, "ProductF": 3}},
                    {'text': "No rush", 'scores': {"ProductA": 3, "ProductB": 1, "ProductC": 1, "ProductD": 3, "ProductE": 1, "ProductF": 2}}
                ]
            },
            {
                'id': 5,
                'text': "What industry are you in?",
                'type': "single",
                'options': [
                    {'text': "Technology", 'scores': {"ProductA": 3, "ProductB": 2, "ProductC": 2, "ProductD": 3, "ProductE": 3, "ProductF": 1}},
                    {'text': "Healthcare", 'scores': {"ProductA": 2, "ProductB": 3, "ProductC": 3, "ProductD": 2, "ProductE": 2, "ProductF": 3}},
                    {'text': "Finance", 'scores': {"ProductA": 3, "ProductB": 2, "ProductC": 1, "ProductD": 3, "ProductE": 1, "ProductF": 2}},
                    {'text': "Education", 'scores': {"ProductA": 1, "ProductB": 3, "ProductC": 3, "ProductD": 2, "ProductE": 2, "ProductF": 3}},
                    {'text': "Manufacturing", 'scores': {"ProductA": 2, "ProductB": 2, "ProductC": 3, "ProductD": 2, "ProductE": 2, "ProductF": 2}},
                    {'text': "Government/Non-Profit", 'scores': {"ProductA": 2, "ProductB": 2, "ProductC": 2, "ProductD": 2, "ProductE": 1, "ProductF": 3}},
                    {'text': "Other", 'scores': {"ProductA": 2, "ProductB": 2, "ProductC": 2, "ProductD": 2, "ProductE": 2, "ProductF": 2}}
                ]
            },
            {
                'id': 6,
                'text': "Do you need integration with existing systems?",
                'type': "single",
                'options': [
                    {'text': "Yes, extensive integration required", 'scores': {"ProductA": 3, "ProductB": 1, "ProductC": 2, "ProductD": 3, "ProductE": 2, "ProductF": 2}},
                    {'text': "Some integration needed", 'scores': {"ProductA": 2, "ProductB": 2, "ProductC": 3, "ProductD": 2, "ProductE": 3, "ProductF": 2}},
                    {'text': "Minimal integration", 'scores': {"ProductA": 1, "ProductB": 3, "ProductC": 2, "ProductD": 1, "ProductE": 3, "ProductF": 2}},
                    {'text': "No integration needed", 'scores': {"ProductA": 1, "ProductB": 3, "ProductC": 3, "ProductD": 1, "ProductE": 2, "ProductF": 1}}
                ]
            },
            {
                'id': 7,
                'text': "What level of support do you require?",
                'type': "single",
                'options': [
                    {'text': "24/7 dedicated support", 'scores': {"ProductA": 3, "ProductB": 1, "ProductC": 1, "ProductD": 3, "ProductE": 2, "ProductF": 2}},
                    {'text': "Business hours support", 'scores': {"ProductA": 2, "ProductB": 2, "ProductC": 3, "ProductD": 2, "ProductE": 3, "ProductF": 3}},
                    {'text': "Email support only", 'scores': {"ProductA": 1, "ProductB": 3, "ProductC": 2, "ProductD": 1, "ProductE": 2, "ProductF": 2}},
                    {'text': "Self-service/community", 'scores': {"ProductA": 1, "ProductB": 3, "ProductC": 3, "ProductD": 1, "ProductE": 2, "ProductF": 1}}
                ]
            },
            {
                'id': 8,
                'text': "How important is data security to you?",
                'type': "single",
                'options': [
                    {'text': "Critical - we handle sensitive data", 'scores': {"ProductA": 3, "ProductB": 2, "ProductC": 1, "ProductD": 3, "ProductE": 1, "ProductF": 3}},
                    {'text': "Very important", 'scores': {"ProductA": 2, "ProductB": 3, "ProductC": 2, "ProductD": 2, "ProductE": 2, "ProductF": 3}},
                    {'text': "Somewhat important", 'scores': {"ProductA": 1, "ProductB": 2, "ProductC": 3, "ProductD": 1, "ProductE": 3, "ProductF": 2}},
                    {'text': "Not a major concern", 'scores': {"ProductA": 1, "ProductB": 3, "ProductC": 3, "ProductD": 1, "ProductE": 3, "ProductF": 1}}
                ]
            },
            {
                'id': 9,
                'text': "Do you need mobile access?",
                'type': "single",
                'options': [
                    {'text': "Yes, mobile app required", 'scores': {"ProductA": 3, "ProductB": 1, "ProductC": 2, "ProductD": 3, "ProductE": 2, "ProductF": 2}},
                    {'text': "Yes, mobile web access", 'scores': {"ProductA": 2, "ProductB": 2, "ProductC": 3, "ProductD": 2, "ProductE": 3, "ProductF": 2}},
                    {'text': "Desktop only is fine", 'scores': {"ProductA": 1, "ProductB": 3, "ProductC": 2, "ProductD": 1, "ProductE": 2, "ProductF": 2}},
                    {'text': "No mobile access needed", 'scores': {"ProductA": 1, "ProductB": 3, "ProductC": 3, "ProductD": 1, "ProductE": 2, "ProductF": 1}}
                ]
            },
            {
                'id': 10,
                'text': "What's your team's technical expertise?",
                'type': "single",
                'options': [
                    {'text': "Highly technical", 'scores': {"ProductA": 3, "ProductB": 1, "ProductC": 1, "ProductD": 3, "ProductE": 2, "ProductF": 2}},
                    {'text': "Moderately technical", 'scores': {"ProductA": 2, "ProductB": 2, "ProductC": 3, "ProductD": 2, "ProductE": 3, "ProductF": 2}},
                    {'text': "Some technical knowledge", 'scores': {"ProductA": 1, "ProductB": 3, "ProductC": 2, "ProductD": 1, "ProductE": 2, "ProductF": 2}},
                    {'text': "Non-technical", 'scores': {"ProductA": 1, "ProductB": 3, "ProductC": 3, "ProductD": 1, "ProductE": 2, "ProductF": 1}}
                ]
            },
            {
                'id': 11,
                'text': "How many users will be using the system?",
                'type': "single",
                'options': [
                    {'text': "1-5 users", 'scores': {"ProductA": 1, "ProductB": 3, "ProductC": 2, "ProductD": 1, "ProductE": 3, "ProductF": 2}},
                    {'text': "6-20 users", 'scores': {"ProductA": 2, "ProductB": 2, "ProductC": 3, "ProductD": 2, "ProductE": 3, "ProductF": 2}},
                    {'text': "21-100 users", 'scores': {"ProductA": 3, "ProductB": 2, "ProductC": 2, "ProductD": 3, "ProductE": 2, "ProductF": 3}},
                    {'text': "100+ users", 'scores': {"ProductA": 3, "ProductB": 1, "ProductC": 1, "ProductD": 3, "ProductE": 1, "ProductF": 3}}
                ]
            },
            {
                'id': 12,
                'text': "Do you need advanced analytics and reporting?",
                'type': "single",
                'options': [
                    {'text': "Yes, comprehensive analytics", 'scores': {"ProductA": 3, "ProductB": 1, "ProductC": 1, "ProductD": 3, "ProductE": 2, "ProductF": 3}},
                    {'text': "Yes, basic reporting", 'scores': {"ProductA": 2, "ProductB": 2, "ProductC": 3, "ProductD": 2, "ProductE": 3, "ProductF": 3}},
                    {'text': "Simple dashboards", 'scores': {"ProductA": 1, "ProductB": 3, "ProductC": 2, "ProductD": 1, "ProductE": 2, "ProductF": 2}},
                    {'text': "No analytics needed", 'scores': {"ProductA": 1, "ProductB": 3, "ProductC": 3, "ProductD": 1, "ProductE": 2, "ProductF": 1}}
                ]
            },
            {
                'id': 13,
                'text': "What's your preferred deployment model?",
                'type': "single",
                'options': [
                    {'text': "Cloud-hosted", 'scores': {"ProductA": 2, "ProductB": 3, "ProductC": 3, "ProductD": 2, "ProductE": 3, "ProductF": 2}},
                    {'text': "On-premises", 'scores': {"ProductA": 3, "ProductB": 1, "ProductC": 1, "ProductD": 3, "ProductE": 1, "ProductF": 3}},
                    {'text': "Hybrid", 'scores': {"ProductA": 3, "ProductB": 2, "ProductC": 2, "ProductD": 3, "ProductE": 2, "ProductF": 3}},
                    {'text': "No preference", 'scores': {"ProductA": 2, "ProductB": 2, "ProductC": 2, "ProductD": 2, "ProductE": 2, "ProductF": 2}}
                ]
            },
            {
                'id': 14,
                'text': "Do you need customization capabilities?",
                'type': "single",
                'options': [
                    {'text': "Highly customizable", 'scores': {"ProductA": 3, "ProductB": 1, "ProductC": 1, "ProductD": 3, "ProductE": 2, "ProductF": 2}},
                    {'text': "Moderate customization", 'scores': {"ProductA": 2, "ProductB": 2, "ProductC": 3, "ProductD": 2, "ProductE": 3, "ProductF": 2}},
                    {'text': "Basic customization", 'scores': {"ProductA": 1, "ProductB": 3, "ProductC": 2, "ProductD": 1, "ProductE": 2, "ProductF": 2}},
                    {'text': "No customization needed", 'scores': {"ProductA": 1, "ProductB": 3, "ProductC": 3, "ProductD": 1, "ProductE": 2, "ProductF": 1}}
                ]
            },
            {
                'id': 15,
                'text': "What's your timeline for ROI?",
                'type': "single",
                'options': [
                    {'text': "Immediate (within 3 months)", 'scores': {"ProductA": 1, "ProductB": 3, "ProductC": 2, "ProductD": 1, "ProductE": 3, "ProductF": 2}},
                    {'text': "Short-term (3-6 months)", 'scores': {"ProductA": 2, "ProductB": 2, "ProductC": 3, "ProductD": 2, "ProductE": 3, "ProductF": 2}},
                    {'text': "Medium-term (6-12 months)", 'scores': {"ProductA": 3, "ProductB": 2, "ProductC": 2, "ProductD": 3, "ProductE": 2, "ProductF": 3}},
                    {'text': "Long-term (1+ years)", 'scores': {"ProductA": 3, "ProductB": 1, "ProductC": 1, "ProductD": 3, "ProductE": 1, "ProductF": 2}}
                ]
            }
        ],
        'products': {
            "ProductA": {
                "name": "Enterprise Pro",
                "description": "Our most comprehensive solution for large enterprises requiring advanced features, customization, and dedicated support.",
                "image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
                "features": [
                    "Advanced analytics and reporting",
                    "24/7 dedicated support",
                    "Highly customizable",
                    "On-premises deployment",
                    "Enterprise-grade security"
                ],
                "bestFor": "Large enterprises with complex needs"
            },
            "ProductB": {
                "name": "Business Starter",
                "description": "Perfect for small to medium businesses looking for an affordable, easy-to-use solution with quick implementation.",
                "image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
                "features": [
                    "Quick setup and implementation",
                    "Affordable pricing",
                    "Cloud-hosted solution",
                    "Basic reporting",
                    "Email support"
                ],
                "bestFor": "Small to medium businesses"
            },
            "ProductC": {
                "name": "Professional Plus",
                "description": "Ideal for growing companies that need a balance of features, flexibility, and reasonable pricing.",
                "image": "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop",
                "features": [
                    "Moderate customization",
                    "Business hours support",
                    "Hybrid deployment options",
                    "Comprehensive reporting",
                    "Mobile web access"
                ],
                "bestFor": "Growing companies"
            },
            "ProductD": {
                "name": "Enterprise Elite",
                "description": "Our flagship solution for organizations requiring the highest level of security, compliance, and scalability.",
                "image": "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=300&fit=crop",
                "features": [
                    "Maximum security and compliance",
                    "Unlimited scalability",
                    "Custom integrations",
                    "Dedicated account manager",
                    "On-premises or hybrid deployment"
                ],
                "bestFor": "Large organizations with strict compliance requirements"
            },
            "ProductE": {
                "name": "Startup Accelerator",
                "description": "Designed specifically for startups and early-stage companies that need rapid growth and scalability.",
                "image": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop",
                "features": [
                    "Rapid deployment and scaling",
                    "Startup-friendly pricing",
                    "Growth-focused features",
                    "Flexible payment terms",
                    "Dedicated startup support"
                ],
                "bestFor": "Startups and early-stage companies"
            },
            "ProductF": {
                "name": "Government & Non-Profit",
                "description": "Specialized solution for government agencies and non-profit organizations with compliance and budget requirements.",
                "image": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop",
                "features": [
                    "Government compliance",
                    "Non-profit pricing",
                    "Specialized reporting",
                    "Grant management tools",
                    "Dedicated compliance support"
                ],
                "bestFor": "Government agencies and non-profits"
            }
        }
    }
    
    row = 1  # Start after headers
    
    # Write config (thank you messages)
    worksheet.write(row, 0, 'config', product_format)
    worksheet.write(row, 1, 'ThankYouYes')
    worksheet.write(row, 2, 'Thank you for your interest! A sales representative will contact you within 24 hours to discuss how our solution can meet your needs.')
    row += 1
    
    worksheet.write(row, 0, 'config', product_format)
    worksheet.write(row, 1, 'ThankYouNo')
    worksheet.write(row, 2, 'Thank you for taking our survey! We hope you found the product recommendation helpful. Feel free to reach out if you have any questions in the future.')
    row += 1
    
    # Write questions
    for question in survey_data['questions']:
        worksheet.write(row, 0, 'question', question_format)
        worksheet.write(row, 1, question['id'])
        worksheet.write(row, 2, question['text'])
        worksheet.write(row, 4, question['type'])
        row += 1
        
        # Write options for this question
        for option in question['options']:
            worksheet.write(row, 0, 'option', option_format)
            worksheet.write(row, 2, option['text'])
            worksheet.write(row, 3, question['id'])
            
            # Convert scores to string format
            scores_str = ','.join([f"{product}:{score}" for product, score in option['scores'].items()])
            worksheet.write(row, 5, scores_str)
            row += 1
    
    # Write products
    for product_id, product in survey_data['products'].items():
        worksheet.write(row, 0, 'product', product_format)
        worksheet.write(row, 1, product_id)
        worksheet.write(row, 6, product['name'])
        worksheet.write(row, 7, product['description'])
        worksheet.write(row, 8, product['image'])
        worksheet.write(row, 9, ', '.join(product['features']))
        worksheet.write(row, 10, product['bestFor'])
        row += 1
    
    # Set column widths
    worksheet.set_column('A:A', 12)  # Type
    worksheet.set_column('B:B', 15)  # Id
    worksheet.set_column('C:C', 50)  # Text
    worksheet.set_column('D:D', 12)  # QuestionId
    worksheet.set_column('E:E', 15)  # QuestionType
    worksheet.set_column('F:F', 80)  # Scores
    worksheet.set_column('G:G', 25)  # Name
    worksheet.set_column('H:H', 60)  # Description
    worksheet.set_column('I:I', 50)  # Image
    worksheet.set_column('J:J', 60)  # Features
    worksheet.set_column('K:K', 40)  # BestFor
    
    # Add instructions sheet
    instructions_sheet = workbook.add_worksheet('Instructions')
    instructions_sheet.write(0, 0, 'Product Survey Excel Structure Instructions')
    instructions_sheet.write(2, 0, 'This Excel file contains the complete survey data from the product-survey-app.')
    instructions_sheet.write(4, 0, 'Structure:')
    instructions_sheet.write(5, 0, '- Questions: Each question has a unique ID and text')
    instructions_sheet.write(6, 0, '- Options: Each option belongs to a question (QuestionId) and has scores for products')
    instructions_sheet.write(7, 0, '- Products: Each product has features and target audience information')
    instructions_sheet.write(9, 0, 'To use with marker-quiz block:')
    instructions_sheet.write(10, 0, '1. Convert this Excel to JSON format')
    instructions_sheet.write(11, 0, '2. Host the JSON file on your server')
    instructions_sheet.write(12, 0, '3. Add a link to the JSON file in the marker-quiz block')
    
    workbook.close()
    print("Excel file 'product-survey-data.xlsx' created successfully!")

if __name__ == "__main__":
    create_survey_excel()
