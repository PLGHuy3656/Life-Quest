# Habit Schema

## habits

``` text
id UUID PK
user_id UUID NOT NULL
name VARCHAR NOT NULL
description TEXT
frequency VARCHAR NOT NULL
target NUMERIC
unit VARCHAR
status VARCHAR NOT NULL
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

## habit_checkins

``` text
id UUID PK
habit_id UUID FK habits(id)
user_id UUID NOT NULL
checkin_date DATE NOT NULL
value NUMERIC
created_at TIMESTAMPTZ
```

Recommended:

``` text
UNIQUE(habit_id, checkin_date)
```

## streaks

``` text
id UUID PK
habit_id UUID UNIQUE
current_streak INT
longest_streak INT
last_completed_date DATE
updated_at TIMESTAMPTZ
```
