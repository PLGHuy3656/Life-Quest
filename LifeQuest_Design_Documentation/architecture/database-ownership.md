# Database Ownership

LifeQuest dùng PostgreSQL.

Có thể triển khai một PostgreSQL instance nhưng tách ownership theo
schema/database:

``` text
identity_schema
goal_schema
habit_schema
social_schema
challenge_schema
gamification_schema
analytics_schema
```

## Rule

-   Service chỉ ghi/đọc bảng thuộc schema của mình.
-   Không tạo foreign key xuyên service.
-   Không JOIN trực tiếp bảng của service khác.
-   Quan hệ xuyên service dùng ID + API/event.

Ví dụ Goal Service lưu `user_id`, nhưng không FK trực tiếp tới
`identity.users`.

Điều này giữ service độc lập và phù hợp khi sau này tách database vật
lý.
