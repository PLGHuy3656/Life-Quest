# Social API

## Friends

``` text
POST   /friends/requests
GET    /friends/requests
POST   /friends/requests/:id/accept
POST   /friends/requests/:id/reject
GET    /friends
DELETE /friends/:userId
```

## Posts

``` text
POST   /posts
GET    /posts
GET    /posts/:postId
DELETE /posts/:postId
```

Create:

``` json
{
  "content": "Hôm nay tôi hoàn thành 5 quest!",
  "visibility": "FRIENDS",
  "proofId": "uuid"
}
```

## Reactions

``` text
POST   /posts/:postId/reactions
DELETE /posts/:postId/reactions
```

## Comments

``` text
GET    /posts/:postId/comments
POST   /posts/:postId/comments
PATCH  /comments/:commentId
DELETE /comments/:commentId
```
