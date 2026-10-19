# Analytics Schema

Analytics là read/model dữ liệu phục vụ thống kê.

## daily_statistics

``` text
id UUID PK
user_id UUID NOT NULL
stat_date DATE NOT NULL
completed_quests INT
completed_habits INT
focus_minutes INT
xp_earned INT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

Recommended: `UNIQUE(user_id, stat_date)`

## behavior_patterns

``` text
id UUID PK
user_id UUID NOT NULL
best_productive_hours JSONB
best_day VARCHAR
average_focus_minutes NUMERIC
completion_rate NUMERIC
interruption_rate NUMERIC
calculated_at TIMESTAMPTZ
```
