# Security Architecture

## Authentication

Gateway validates access token or forwards authenticated identity
context to service.

## Authorization

Service vẫn phải kiểm tra resource ownership.

Ví dụ: `PATCH /goals/:goalId` không chỉ dựa vào token hợp lệ; Goal
Service phải kiểm tra `goal.user_id = currentUserId`.

## Internal service authentication

Các service-to-service request nên dùng internal credentials/service
token ở giai đoạn production.

## Secrets

Không commit: - JWT secret - Database password - RabbitMQ credentials -
AI API key
