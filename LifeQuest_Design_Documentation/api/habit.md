# Habit API

``` text
POST   /habits
GET    /habits
GET    /habits/:habitId
PATCH  /habits/:habitId
DELETE /habits/:habitId
POST   /habits/:habitId/check-ins
GET    /habits/:habitId/history
GET    /habits/:habitId/streak
```

Create:

``` json
{
  "name": "Đọc sách",
  "description": "Đọc ít nhất 20 phút",
  "frequency": "DAILY",
  "target": 20,
  "unit": "MINUTES"
}
```

Check-in:

``` json
{
  "date": "2026-10-19",
  "value": 25
}
```

Success:

``` json
{
  "success": true,
  "data": {
    "completed": true,
    "currentStreak": 5
  }
}
```
