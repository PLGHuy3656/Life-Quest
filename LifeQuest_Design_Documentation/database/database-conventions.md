# PostgreSQL Conventions

## Naming

-   table: `snake_case`, plural
-   column: `snake_case`
-   primary key: `id`
-   foreign key nội bộ: `<entity>_id`
-   timestamps: `created_at`, `updated_at`

## ID

Khuyến nghị UUID cho public ID:

``` sql
id UUID PRIMARY KEY
```

## Timestamps

Dùng:

``` sql
TIMESTAMPTZ
```

## Soft delete

Chỉ dùng khi nghiệp vụ cần khôi phục/audit:

``` sql
deleted_at TIMESTAMPTZ NULL
```

## Enum

Ưu tiên CHECK constraint hoặc application enum cho các trạng thái thay
đổi thường xuyên.

## Index

Index các trường: - foreign key - query filter thường xuyên - unique
business key - timestamp phục vụ sorting/range query
