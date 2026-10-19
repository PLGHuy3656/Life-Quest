# System Architecture

``` text
Web / Mobile / Admin
        |
        v
   API Gateway
        |
        +---------------- Identity Service
        +---------------- Goal & Quest Service
        +---------------- Habit Service
        +---------------- Social Service
        +---------------- Challenge Service
        +---------------- Gamification Service
        +---------------- Analytics Service
        +---------------- AI Service
                         |
                      PostgreSQL
                         |
                    RabbitMQ Events
```

## Quy tắc

-   Client chỉ gọi Gateway.
-   Gateway route request tới service phù hợp.
-   Mỗi service có database/schema ownership riêng.
-   Không service nào query trực tiếp database của service khác.
-   Synchronous business request dùng REST.
-   Asynchronous side effects dùng events.
