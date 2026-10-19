# Goal & Quest Schema

## goals

``` text
id UUID PK
user_id UUID NOT NULL
title VARCHAR NOT NULL
description TEXT
deadline DATE
priority VARCHAR
status VARCHAR NOT NULL
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

## milestones

``` text
id UUID PK
goal_id UUID FK goals(id)
title VARCHAR NOT NULL
description TEXT
position INT
status VARCHAR
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

## quests

``` text
id UUID PK
user_id UUID NOT NULL
goal_id UUID NULL
milestone_id UUID NULL
title VARCHAR NOT NULL
description TEXT
estimated_minutes INT
scheduled_at TIMESTAMPTZ
status VARCHAR NOT NULL
completed_at TIMESTAMPTZ NULL
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

## focus_sessions

``` text
id UUID PK
user_id UUID NOT NULL
quest_id UUID NOT NULL
planned_duration INT NOT NULL
started_at TIMESTAMPTZ
ended_at TIMESTAMPTZ NULL
status VARCHAR NOT NULL
interruption_count INT DEFAULT 0
created_at TIMESTAMPTZ
```

## Important

`user_id` không FK sang Identity DB/schema nếu service ownership được
tách độc lập.
