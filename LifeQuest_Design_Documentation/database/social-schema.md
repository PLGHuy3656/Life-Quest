# Social Schema

## friendships

``` text
id UUID PK
requester_id UUID NOT NULL
receiver_id UUID NOT NULL
status VARCHAR NOT NULL
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

## posts

``` text
id UUID PK
user_id UUID NOT NULL
content TEXT NOT NULL
visibility VARCHAR NOT NULL
proof_id UUID NULL
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

## comments

``` text
id UUID PK
post_id UUID FK posts(id)
user_id UUID NOT NULL
content TEXT NOT NULL
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

## reactions

``` text
id UUID PK
post_id UUID FK posts(id)
user_id UUID NOT NULL
type VARCHAR NOT NULL
created_at TIMESTAMPTZ
```

Recommended: `UNIQUE(post_id, user_id)`
