# Challenge API

``` text
POST   /challenges
GET    /challenges
GET    /challenges/:challengeId
PATCH  /challenges/:challengeId
DELETE /challenges/:challengeId
POST   /challenges/:challengeId/join
DELETE /challenges/:challengeId/participation
GET    /challenges/:challengeId/progress
GET    /challenges/:challengeId/leaderboard
```

Create:

``` json
{
  "name": "30 Days Reading",
  "description": "Đọc sách 30 ngày",
  "startDate": "2026-11-01",
  "endDate": "2026-11-30",
  "type": "STREAK",
  "visibility": "FRIENDS"
}
```

Duo:

``` text
POST /duos
GET  /duos
GET  /duos/:duoId
POST /duos/:duoId/check-ins
GET  /duos/:duoId/streak
```
