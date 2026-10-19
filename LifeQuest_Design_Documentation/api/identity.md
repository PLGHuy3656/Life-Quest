# Identity API

## POST /auth/register

Auth: No

Request:

``` json
{
  "username": "kha",
  "email": "kha@example.com",
  "password": "Password123"
}
```

Success: `201`

``` json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "kha",
      "email": "kha@example.com"
    }
  }
}
```

Errors: - `400 VALIDATION_ERROR` - `409 EMAIL_ALREADY_EXISTS` -
`409 USERNAME_ALREADY_EXISTS`

## POST /auth/login

Auth: No

Request:

``` json
{
  "email": "kha@example.com",
  "password": "Password123"
}
```

Success: `200`

``` json
{
  "success": true,
  "data": {
    "accessToken": "jwt",
    "refreshToken": "token",
    "user": {
      "id": "uuid",
      "username": "kha"
    }
  }
}
```

## GET /users/me

Auth: Required

## PATCH /users/me

Auth: Required

Request:

``` json
{
  "displayName": "Khá",
  "avatarUrl": "https://..."
}
```
