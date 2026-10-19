# AI API

## POST /ai/goal-plans

Request:

``` json
{
  "goal": "Đạt TOEIC 650",
  "deadline": "2027-06-01",
  "availableMinutesPerDay": 90,
  "daysPerWeek": 6
}
```

Response should contain a proposed plan:

``` json
{
  "success": true,
  "data": {
    "goal": "...",
    "milestones": [],
    "suggestedQuests": [],
    "suggestedHabits": []
  }
}
```

AI-generated data is a proposal. User should confirm before permanent
creation unless product design explicitly chooses auto-create.

## POST /ai/behavior-analysis

Analyze behavior data and return insights.

## GET /ai/recommendations

Return adaptive recommendations.
