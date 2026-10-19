# Analytics API

``` text
GET /analytics/overview
GET /analytics/goals
GET /analytics/habits
GET /analytics/focus
GET /analytics/consistency
GET /analytics/activity
GET /analytics/behavior
```

Overview:

``` json
{
  "completionRate": 82,
  "completedQuests": 41,
  "completedHabits": 56,
  "focusMinutes": 620,
  "currentStreak": 12,
  "longestStreak": 18
}
```

Behavior:

``` json
{
  "bestProductiveHours": [19,20,21],
  "bestDay": "SUNDAY",
  "averageFocusMinutes": 42,
  "completionRate": 82,
  "interruptionRate": 12
}
```
