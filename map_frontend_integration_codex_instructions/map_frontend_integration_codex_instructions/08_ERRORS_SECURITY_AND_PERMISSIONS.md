# 08. Errors, Security and Permissions

## Auth

Use the same auth mechanism as the main app.

Do not create a second auth context for map-service.

API and WebSocket must attach authentication consistently.

## Permission source

Frontend receives effective permissions from map-service snapshot.

Do not guess rights from UI role names only.

Use:

```ts
snapshot.permissions.canMoveOwnTokens
snapshot.permissions.canMoveAnyToken
snapshot.permissions.canManageMap
snapshot.permissions.canManageTokens
snapshot.permissions.isGm
```

Core backend remains source of truth, but map-service provides effective map permissions in snapshot.

## UI permissions

Disable or hide actions according to permissions:

```text
canManageMap:
- edit grid
- upload/change background
- edit map definition

canManageTokens:
- create/delete/update tokens

canMoveOwnTokens:
- move own tokens

canMoveAnyToken:
- move all tokens
```

Frontend-side checks are UX only.

Backend remains authoritative.

## Error presentation

Implement a map-specific error adapter:

```ts
function toMapUserMessage(error: unknown): string;
function isRevisionConflict(error: unknown): boolean;
function isForbidden(error: unknown): boolean;
```

## Important REST errors

```text
401 UNAUTHORIZED:
- redirect/login or show auth expired

403 FORBIDDEN:
- show permission error

404 NOT_FOUND:
- show not found screen

409 REVISION_CONFLICT:
- reload snapshot

422 VALIDATION_ERROR:
- show field errors

413 ASSET_TOO_LARGE:
- show size limit message

415 UNSUPPORTED_IMAGE_TYPE:
- show allowed formats
```

## WebSocket errors

Errors from `/user/queue/map-errors` must not crash the page.

Handle:

```text
REVISION_CONFLICT -> reload snapshot
TOKEN_LOCKED -> cancel local drag
FORBIDDEN -> cancel action and show message
MAP_SESSION_CLOSED -> disable actions
VALIDATION_ERROR -> cancel action and show message
```

## Sensitive data

Do not expose:

- raw storage keys to normal users if not needed;
- internal exception messages;
- backend stack traces;
- access tokens in logs;
- full WebSocket auth headers in logs.

## Asset URLs

If backend proxy is used:

```text
GET /api/map-assets/{assetId}/content
```

If pre-signed URLs are added later:

```text
Frontend requests temporary download URL from map-service.
Frontend must not construct direct MinIO URLs itself.
```

## Frontend logs

Allowed:

```text
mapSessionId
requestId
event type
revision
```

Avoid logging:

```text
JWT tokens
raw auth headers
private object storage URLs with signatures
```
