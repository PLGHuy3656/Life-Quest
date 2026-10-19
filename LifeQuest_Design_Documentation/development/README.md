# Development

## Feature workflow

``` text
Requirement
   ↓
Use Case
   ↓
Business Rule
   ↓
Service Boundary
   ↓
Database Design
   ↓
API Contract
   ↓
Frontend + Backend parallel development
   ↓
Unit Test
   ↓
Integration Test
   ↓
E2E Test
```

## Git branch suggestion

``` text
main
develop
feature/<service>-<feature>
fix/<service>-<issue>
```

## Definition of Done

Một feature chỉ hoàn thành khi: - Use case rõ - API documented - DB
migration hoàn chỉnh - Validation có - Authorization có - Test có -
Error code documented - Frontend integration hoàn tất - Event contract
cập nhật nếu có
