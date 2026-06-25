# 09. Testing and Acceptance Criteria

## Unit tests

Required tests for math utilities:

```text
gridToImagePoint without rotation
imagePointToGrid without rotation
snap-to-grid behavior
gridToViewportPoint with viewport scale/offset
viewportPointToGrid with viewport scale/offset
token size calculation
```

If rotation is implemented:

```text
gridToImagePoint with rotation
imagePointToGrid with rotation
roundtrip grid -> image -> grid
```

## State tests

Required reducer/store tests:

```text
snapshot initializes committed state
TOKEN_MOVED sequential event updates token and revision
TOKEN_MOVED skipped revision sets needsResync
transient drag preview does not change committed token
cursor event updates transient cursor only
ping event adds transient ping only
resync snapshot replaces committed state
```

## API client tests

Mock HTTP and verify:

```text
auth is attached
upload uses multipart/form-data
REST errors are parsed into MapApiError
REVISION_CONFLICT is recognized
asset content URL is generated through map-service endpoint
```

## WebSocket tests

If the project has a test strategy for WebSocket clients, cover:

```text
connect -> subscribe -> join
disconnect -> reconnect -> snapshot reload
MOVE_TOKEN includes expectedRevision
drag preview is throttled
cursor update is throttled
user error REVISION_CONFLICT triggers resync
```

## UI acceptance checklist

Map list:

```text
GM can see campaign maps
GM can create map
GM can open editor
GM can start/open session
```

Map editor:

```text
GM can upload image
image is displayed
grid overlay is visible
GM can adjust cell size
GM can adjust origin
GM can save grid config
reload preserves grid config
```

Map session:

```text
snapshot loads
background image displays
grid displays over image
tokens display on grid cells
player can drag allowed token
drop sends MOVE_TOKEN with expectedRevision
confirmed TOKEN_MOVED updates position
stale revision causes automatic snapshot reload
drag preview does not permanently move token
cursor/ping are transient
forbidden movement shows error
locked token cannot be moved
```

## Performance acceptance

MVP should remain usable with:

```text
map image around 4096x4096
50 tokens
several connected users
frequent cursor updates
```

Do not optimize prematurely, but avoid obvious problems:

```text
do not re-render the entire app on every cursor event
do not store high-frequency transient events in global app-wide state if it causes broad rerenders
throttle cursor/drag-preview
memoize rendered token components where relevant
```

## Regression risks

Before merging:

```text
existing campaign/character pages still work
existing auth still works
main app routing still works
map-service down shows graceful error
WebSocket disconnect does not crash app
```
