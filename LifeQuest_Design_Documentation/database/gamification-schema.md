# Gamification Schema

## user_progress

``` text
user_id UUID PK
level INT NOT NULL
xp INT NOT NULL
coins INT NOT NULL
current_streak INT NOT NULL
updated_at TIMESTAMPTZ
```

## xp_transactions

``` text
id UUID PK
user_id UUID NOT NULL
amount INT NOT NULL
source_type VARCHAR NOT NULL
source_id UUID NULL
event_id UUID UNIQUE
created_at TIMESTAMPTZ
```

## achievements

``` text
id UUID PK
code VARCHAR UNIQUE NOT NULL
name VARCHAR NOT NULL
description TEXT
condition_config JSONB
created_at TIMESTAMPTZ
```

## user_achievements

``` text
id UUID PK
user_id UUID NOT NULL
achievement_id UUID FK achievements(id)
unlocked_at TIMESTAMPTZ
```

## Principle

XP transaction là audit trail. Không chỉ update số `xp` hiện tại mà bỏ
mất lịch sử.
