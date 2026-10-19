# Event Contract

## Envelope

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

## Core events

-   `UserRegistered`
-   `UserProfileUpdated`
-   `GoalCreated`
-   `GoalCompleted`
-   `MilestoneCompleted`
-   `QuestCreated`
-   `QuestCompleted`
-   `HabitCreated`
-   `HabitCompleted`
-   `StreakUpdated`
-   `StreakBroken`
-   `FocusStarted`
-   `FocusCompleted`
-   `FocusInterrupted`
-   `FriendAccepted`
-   `PostCreated`
-   `PostReacted`
-   `CommentCreated`
-   `ChallengeCreated`
-   `ChallengeJoined`
-   `XPGranted`
-   `LevelUp`
-   `AchievementUnlocked`

## Event ownership

Producer owns event definition. Consumers must tolerate unknown future
fields.
