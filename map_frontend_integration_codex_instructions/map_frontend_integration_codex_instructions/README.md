# Map Frontend Integration Instructions

This package describes how to integrate the map-service MVP into the existing React frontend.

Core decisions:

- Do not create a separate iframe-based map frontend.
- Keep one main React application.
- Implement the map as an isolated feature module inside the existing frontend.
- The map-service owns map runtime state: map definitions, sessions, tokens, events, revision.
- The core backend owns users, campaigns, characters, inventory, permissions.
- React talks to both:
  - core backend for campaign/character context;
  - map-service for map assets, definitions, sessions, snapshots and realtime map events.
- Map image is background only.
- System grid is the source of truth.
- Token positions must be stored and rendered using grid coordinates, not raw pixels.
- REST is used for snapshots and durable CRUD operations.
- WebSocket/STOMP is used for realtime map commands and events.
- Confirmed movement must use expectedRevision.
- Drag preview, cursor, ping are transient and must not change local committed revision.
- The frontend must be able to recover from missed events by reloading snapshot.

Recommended order:

1. Read `00_FRONTEND_GLOBAL_RULES.md`.
2. Read `01_FRONTEND_ARCHITECTURE.md`.
3. Implement API clients from `02_API_AND_TYPE_CONTRACTS.md`.
4. Implement state model from `03_STATE_MODEL.md`.
5. Implement rendering from `04_RENDERING_ENGINE.md`.
6. Implement grid calibration from `05_GRID_CALIBRATION.md`.
7. Implement WebSocket flow from `06_WEBSOCKET_FLOW.md`.
8. Implement screens from `07_UI_SCREENS_AND_ROUTES.md`.
9. Add error/security handling from `08_ERRORS_SECURITY_AND_PERMISSIONS.md`.
10. Add tests from `09_TESTING_ACCEPTANCE.md`.
11. Use `10_CODEX_PROMPTS_FRONTEND.md` as step-by-step prompts for Codex.
