# 07. UI Screens and Routes

Adapt names to existing route conventions.

## Route group

Suggested routes:

```text
/campaigns/:campaignId/maps
/campaigns/:campaignId/maps/new
/campaigns/:campaignId/maps/:mapId/edit
/campaigns/:campaignId/map-sessions/:sessionId
```

## CampaignMapListPage

Purpose:

- show maps for campaign;
- create new map;
- open editor;
- start/open active session.

Data:

- campaign context from core frontend;
- maps from map-service.

Actions:

- upload/create map;
- edit map;
- create session;
- open session.

## MapEditorPage

Purpose:

- upload/select background image;
- configure grid;
- preview grid overlay;
- save map definition.

MVP controls:

```text
name
background image upload
grid type: SQUARE only initially
originX/originY
cellWidthPx/cellHeightPx
lock width/height
rotationDeg
cellWorldSize
cellWorldUnit
save
reset
```

## MapSessionPage

Purpose:

- live game map.

Responsibilities:

```text
load snapshot
connect WebSocket
render map
render tokens
allow token movement
show cursors/pings
show current revision/resync state
show permissions-aware toolbar
```

UI areas:

```text
Top toolbar:
- session status
- revision/resync indicator
- zoom controls
- fit/reset view
- ping tool
- select/move tool

Left/sidebar optional:
- token list
- players present
- map info

Main area:
- map viewport
```

## Token interactions

Player:

- can move own allowed tokens if permission says so.
- cannot move locked token.
- cannot move another player's token unless permission allows.

GM:

- can move any token if `canMoveAnyToken = true`.
- can lock/unlock tokens if implemented.
- can create/delete tokens if implemented.

## Loading states

The map page must handle:

```text
snapshot loading
asset image loading
WebSocket connecting
WebSocket disconnected
resyncing snapshot
forbidden access
not found
closed session
```

## UX for revision conflict

Do not show a scary crash.

Use calm UI:

```text
Map state changed. Refreshing current position...
```

Then reload snapshot automatically.

## MVP UI limits

Do not implement advanced features until backend and base map are stable:

```text
fog editor
lighting
wall editor
initiative tracker
spell area templates
measurement automation
automatic pathfinding
```
