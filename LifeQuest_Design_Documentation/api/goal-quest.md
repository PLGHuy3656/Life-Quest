# Goal & Quest API

## Goals

``` text
POST   /goals
GET    /goals
GET    /goals/:goalId
PATCH  /goals/:goalId
DELETE /goals/:goalId
```

Create:

``` json
{
  "title": "Đạt TOEIC 650",
  "description": "Cải thiện Listening và Reading",
  "deadline": "2027-06-01",
  "priority": "HIGH"
}
```

## Milestones

``` text
POST   /goals/:goalId/milestones
GET    /goals/:goalId/milestones
GET    /milestones/:milestoneId
PATCH  /milestones/:milestoneId
DELETE /milestones/:milestoneId
```

## Quests

``` text
POST   /quests
GET    /quests
GET    /quests/:questId
PATCH  /quests/:questId
DELETE /quests/:questId
POST   /quests/:questId/complete
```

Complete response:

``` json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "COMPLETED",
    "completedAt": "2026-10-19T12:30:00Z"
  }
}
```

## Daily Quest

``` text
GET  /daily-quests
GET  /daily-quests/today
POST /daily-quests/:questId/complete
```

## Focus

``` text
POST /focus/sessions
GET  /focus/sessions
GET  /focus/sessions/:sessionId
POST /focus/sessions/:sessionId/pause
POST /focus/sessions/:sessionId/resume
POST /focus/sessions/:sessionId/interrupt
POST /focus/sessions/:sessionId/complete
```
