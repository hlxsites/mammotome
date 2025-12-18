# Marker Quiz - Sortable Question Authoring Guide

## Overview

Sortable questions allow users to drag and drop options to rank them in order of preference. The ranking order affects product scoring differently than traditional selection-based questions.

## Data Source Format

The survey data is loaded from either:
1. **JSON file link** - A link (`<a>`) in the block HTML pointing to a `.json` file
2. **Block config** - The `surveyData` configuration property

The data structure should be an array of objects with a `Type` field that categorizes rows as:
- `question` - Question definitions
- `option` - Question options
- `other` - "Other" option types
- `product` - Product definitions
- `config` - Configuration settings

## Sortable Question Configuration

To create a sortable question, you need to set up the following fields in your data source:

### Question Row Fields

In your data source, each question row should have these columns:

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `Type` | Yes | Must be `"question"` | `question` |
| `Id` | Yes | Unique question identifier | `3` |
| `Text` | Yes | Question text displayed to users | `"What is the most important for you when choosing a marker?"` |
| `QuestionType` | No | **For sortable questions, use `"single"` or leave empty (defaults to `single`)** | `single` or empty |
| `Layout` | No | Layout direction (`vertical` or `horizontal`) | `vertical` |
| `Image` | No | Optional question image URL | `https://example.com/image.jpg` |
| **`Sortable`** | **Yes** | **Set to `"true"` or `"TRUE"` to enable sorting** | **`TRUE`** |
| `SortType` | No | Sort type (defaults to `"normal"`) | `normal`, `priority`, `filter`, `multiplier` |
| `SortWeight` | No | Weight multiplier (defaults to `1`) | `2` |
| **`RankScores`** | **Required** | **JSON string with ranking scores** | **See format below** |

### QuestionType for Sortable Questions

**Use `QuestionType: "single"` or leave it empty (it defaults to `single`).**

For sortable questions:
- The UI displays **radio buttons** (single selection style) instead of checkboxes
- Users must **click/select at least one option** to proceed (validation requirement)
- Users can **drag options** to reorder them regardless of selection
- The **actual scoring** comes from the drag order (rank position), not from which option is selected
- All options are part of the ranking interaction, but selection is required for navigation

**Note:** While `multi` type technically works, `single` is the recommended type for ranking/sorting questions as it aligns with the visual metaphor of ranking all options in order.

### RankScores Format

The `RankScores` field must be a **valid JSON string** that maps rank positions to product scores.

**Structure:**
```json
{
  "rank_1": {
    "productId1": 10,
    "productId2": 5,
    "productId3": 0
  },
  "rank_2": {
    "productId1": 5,
    "productId2": 10,
    "productId3": 5
  },
  "rank_3": {
    "productId1": 0,
    "productId2": 5,
    "productId3": 10
  },
  "rank_4": {
    "productId1": 0,
    "productId2": 0,
    "productId3": 5
  }
}
```

**Notes:**
- `rank_1` = First position (highest priority)
- `rank_2` = Second position
- `rank_3` = Third position
- `rank_4` = Fourth position
- Continue for as many ranks as you have options
- Product IDs must match the product `Id` values in your product rows (e.g., `hmplus`, `lumimark`, `biomarc`, `mammomark`)
- Scores are numbers (positive or negative)

**Example Based on Your Data:**

For Question 3 with 4 options:
- "Long-term ultrasound visibility"
- "Anti-Migration"
- "Multiple/Unique Shapes"
- "Affordability"

If you want to score based on the ranking:
```json
{"rank_1":{"hmplus":10,"lumimark":8,"biomarc":5,"mammomark":3},"rank_2":{"hmplus":5,"lumimark":10,"biomarc":8,"mammomark":5},"rank_3":{"hmplus":3,"lumimark":5,"biomarc":10,"mammomark":8},"rank_4":{"hmplus":0,"lumimark":0,"biomarc":0,"mammomark":10}}
```

**In Excel/CSV/Authoring Tool:**
```
RankScores
{"rank_1":{"hmplus":10,"lumimark":8,"biomarc":5,"mammomark":3},"rank_2":{"hmplus":5,"lumimark":10,"biomarc":8,"mammomark":5},"rank_3":{"hmplus":3,"lumimark":5,"biomarc":10,"mammomark":8},"rank_4":{"hmplus":0,"lumimark":0,"biomarc":0,"mammomark":10}}
```

**Tips for Authoring:**
- Keep the JSON string on a single line in your authoring tool
- Ensure all product IDs match exactly (case-sensitive)
- Make sure you have a rank entry for each position (rank_1, rank_2, etc.) up to the number of options

### Option Rows

Options for sortable questions are defined the same way as regular questions:

- `Type` should be `"option"` or `"other"`
- `QuestionId` must match the question `Id` (e.g., `3`)
- `Text` contains the option text
- **Note:** For sortable questions, the option `Scores` field is typically **ignored** during scoring (scoring comes from `RankScores` in the question row). However, you can still define them as a fallback or for display purposes.

**Example Option Rows:**
```
Type    QuestionId  Text                              Scores
option  3           Long-term ultrasound visibility   (optional, ignored for sortable)
option  3           Anti-Migration                    (optional, ignored for sortable)
option  3           Multiple/Unique Shapes            hmplus:1,lumimark:1
option  3           Affordability                     lumimark:1,biomarc:1,mammomark:1
```

## How Scoring Works for Sortable Questions

When a question is sortable:

1. **User Experience:**
   - Users see drag handles (⋮⋮) on each option
   - Users can drag options to reorder them
   - The order represents their ranking/preference
   - Users must select at least one option to proceed (visual feedback)

2. **Scoring Logic:**
   - The system captures the final sorted order of options
   - For each position in the sorted order, it looks up scores in `RankScores`
   - Scores are added to products based on their rank position
   - Example: 
     - If "Long-term ultrasound visibility" is ranked 1st, products get scores from `rank_1`
     - If "Anti-Migration" is ranked 2nd, they get scores from `rank_2`
     - And so on...

3. **Important:** For sortable questions, the option `Scores` field is **not used** in calculation. Only `RankScores` from the question row is used.

## Complete Example

### Data Source (Excel/CSV/JSON)

**Question:**
```
Type      Id  Text                                                    QuestionType  Sortable  RankScores
question  3   What is the most important for you when choosing a marker?  (empty)     TRUE      {"rank_1":{"hmplus":10,"lumimark":8,"biomarc":5,"mammomark":3},"rank_2":{"hmplus":5,"lumimark":10,"biomarc":8,"mammomark":5},"rank_3":{"hmplus":3,"lumimark":5,"biomarc":10,"mammomark":8},"rank_4":{"hmplus":0,"lumimark":0,"biomarc":0,"mammomark":10}}
```

**Options:**
```
Type    QuestionId  Text                              Scores
option  3           Long-term ultrasound visibility   
option  3           Anti-Migration                    
option  3           Multiple/Unique Shapes            hmplus:1,lumimark:1
option  3           Affordability                     lumimark:1,biomarc:1,mammomark:1
```

**Products:**
```
Type     Id        Name         Description         Image
product  hmplus    HM Plus      Description here    /image1.jpg
product  lumimark  LumiMark     Description here    /image2.jpg
product  biomarc   BioMarc      Description here    /image3.jpg
product  mammomark MammoMark    Description here    /image4.jpg
```

### Result
- User sees four options with drag handles
- User can drag them to rank (e.g., "Anti-Migration" first, "Long-term ultrasound visibility" second, etc.)
- Scoring is based on the final rank order using `RankScores`
- Total product scores are accumulated based on where each option was ranked