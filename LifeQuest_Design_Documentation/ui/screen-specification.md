# Screen Specification

Mỗi screen phải xác định: - Purpose - Entry point - API used - Loading
state - Empty state - Error state - Success state -
Permission/visibility - Pagination nếu có

## Dashboard

APIs: - `GET /users/me` - `GET /daily-quests/today` -
`GET /gamification/profile` - `GET /analytics/overview`

## Goal Detail

APIs: - `GET /goals/:goalId` - `GET /goals/:goalId/milestones`

## Quest Detail

APIs: - `GET /quests/:questId` - `POST /quests/:questId/complete`

## Habit Detail

APIs: - `GET /habits/:habitId` - `POST /habits/:habitId/check-ins` -
`GET /habits/:habitId/streak`
