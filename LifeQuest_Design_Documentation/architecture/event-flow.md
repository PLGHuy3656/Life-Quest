# Event Flow

## QuestCompleted

``` text
Frontend
  |
POST /quests/:id/complete
  |
Gateway
  |
Goal Service
  |
PostgreSQL
  |
QuestCompleted
  |
RabbitMQ
  +--> Gamification -> XP / Coin / Achievement
  +--> Analytics -> statistics
  +--> AI -> behavior data (future)
```

## Event Envelope

``` json
{
  "eventId": "evt_001",
  "eventType": "QuestCompleted",
  "version": 1,
  "occurredAt": "2026-10-19T12:30:00Z",
  "producer": "goal-quest-service",
  "data": {}
}
```
