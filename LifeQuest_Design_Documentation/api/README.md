# API Contract

Base URL: `/api/v1`

Response envelope:

``` json
{
  "success": true,
  "data": {}
}
```

Error:

``` json
{
  "success": false,
  "error": {
    "code": "GOAL_NOT_FOUND",
    "message": "Goal not found",
    "details": null
  }
}
```

Auth: `Authorization: Bearer <access_token>`

Tài liệu endpoint: - `identity.md` - `goal-quest.md` - `habit.md` -
`social.md` - `challenge.md` - `gamification.md` - `analytics.md` -
`ai.md` - `events.md`
