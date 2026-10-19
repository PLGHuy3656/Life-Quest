# Identity Schema

## users

``` text
id UUID PK
username VARCHAR UNIQUE NOT NULL
email VARCHAR UNIQUE NOT NULL
password_hash TEXT NOT NULL
display_name VARCHAR
avatar_url TEXT
role VARCHAR NOT NULL
status VARCHAR NOT NULL
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

## refresh_tokens

``` text
id UUID PK
user_id UUID NOT NULL
token_hash TEXT NOT NULL
expires_at TIMESTAMPTZ NOT NULL
revoked_at TIMESTAMPTZ NULL
created_at TIMESTAMPTZ
```

`user_id` thuộc cùng Identity Service nên có FK nội bộ.
