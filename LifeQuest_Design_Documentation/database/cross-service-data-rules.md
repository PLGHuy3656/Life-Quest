# Cross-Service Data Rules

## Không dùng foreign key xuyên service

Ví dụ:

``` text
goal.user_id -> identity.users.id
```

Không tạo FK vật lý nếu Identity và Goal có ownership độc lập.

## Không JOIN xuyên service

Không:

``` sql
SELECT ...
FROM goal.goals
JOIN identity.users ...
```

## Cách lấy dữ liệu

-   Nếu cần realtime: REST/API.
-   Nếu cần analytics/eventual consistency: event.
-   Nếu cần display profile trong feed: Social có thể giữ snapshot
    `display_name`, `avatar_url` hoặc gọi Identity theo policy.

## ID consistency

Tất cả service dùng UUID string ở API.
