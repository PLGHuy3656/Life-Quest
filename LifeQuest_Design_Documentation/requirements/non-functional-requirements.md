# Non-Functional Requirements

## Performance

-   API thông thường mục tiêu \< 500ms ở điều kiện bình thường.
-   API phân trang bắt buộc với collection lớn.
-   AI request có thể asynchronous nếu xử lý lâu.

## Security

-   Password phải hash, không lưu plaintext.
-   Access token không chứa dữ liệu nhạy cảm.
-   Authorization phải kiểm tra ownership.
-   Admin endpoint yêu cầu role ADMIN.
-   Validate body/query/path ở backend.
-   Không tin dữ liệu do frontend gửi.

## Reliability

-   Service-to-service call phải có timeout.
-   Event consumer phải xử lý idempotent.
-   Không để một event xử lý 2 lần tạo ra double reward.

## Maintainability

-   Mỗi service độc lập.
-   Controller không chứa business logic.
-   Service layer chứa business logic.
-   Repository/data-access layer làm việc với PostgreSQL.

## Observability

Mỗi request nên có: - requestId - userId nếu authenticated -
serviceName - timestamp - statusCode - latency
