# Challenge Schema

## challenges

``` text
id UUID PK
creator_id UUID NOT NULL
name VARCHAR NOT NULL
description TEXT
start_date DATE NOT NULL
end_date DATE NOT NULL
type VARCHAR NOT NULL
visibility VARCHAR NOT NULL
status VARCHAR NOT NULL
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

## challenge_participants

``` text
id UUID PK
challenge_id UUID FK challenges(id)
user_id UUID NOT NULL
joined_at TIMESTAMPTZ
progress NUMERIC
status VARCHAR
```

Recommended: `UNIQUE(challenge_id, user_id)`
