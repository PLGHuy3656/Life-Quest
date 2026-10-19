# Gamification API

## Profile

`GET /gamification/profile`

Response:

``` json
{
  "success": true,
  "data": {
    "level": 8,
    "xp": 760,
    "xpToNextLevel": 1000,
    "coins": 1250,
    "currentStreak": 12
  }
}
```

## Achievements

``` text
GET /achievements
GET /users/me/achievements
```

## Titles

``` text
GET   /titles
GET   /users/me/titles
PATCH /users/me/title
```

## Inventory

``` text
GET  /inventory
GET  /items
POST /items/:itemId/equip
POST /items/:itemId/unequip
```

## Mascot

``` text
GET  /mascot
PATCH /mascot/persona
POST /mascot/interactions
```

Không có public endpoint để frontend tự cộng XP/coin.
