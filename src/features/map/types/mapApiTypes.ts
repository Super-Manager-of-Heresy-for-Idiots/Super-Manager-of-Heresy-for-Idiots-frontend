/**
 * Wire-level types for the map-service REST API.
 *
 * These mirror the map-service Java DTOs exactly (record field names == JSON keys).
 * The map-service is a SEPARATE backend from the core app — do not fold these into
 * the core `@/types` barrel. Source of truth: the `SuperManagerofHeresyforIdiots-map`
 * repo (`com.dnd.map.map_service.*`).
 */

export type UUID = string;

/** ISO-8601 instant string (Java `Instant` serialized by Jackson). */
export type IsoInstant = string;

/* ── Enums (mirror backend enums) ───────────────────────────── */

export type GridType = 'SQUARE' | 'HEX_VERTICAL' | 'HEX_HORIZONTAL' | 'FREE';

export type MapSessionStatus = 'ACTIVE' | 'PAUSED' | 'CLOSED';

export type TokenType = 'CHARACTER' | 'NPC' | 'MONSTER' | 'OBJECT' | 'MARKER';

/**
 * Committed event types broadcast on `/topic/map-sessions/{id}/events` (backend
 * `MapEventType`). Each carries a sequential `revision`; the FE applies them in
 * order through the revision guard. Transient presence messages (drag preview,
 * cursor, ping) are NOT in this enum — they ride the presence topic and never
 * advance the revision.
 */
export type MapEventType =
  | 'TOKEN_CREATED_EVENT'
  | 'TOKEN_MOVED_EVENT'
  | 'TOKEN_UPDATED_EVENT'
  | 'TOKEN_MOVE_WARNING'
  | 'TOKEN_DELETED_EVENT'
  | 'TOKEN_LOCKED_EVENT'
  | 'TOKEN_UNLOCKED_EVENT'
  | 'FOG_REVEALED_EVENT'
  | 'FOG_HIDDEN_EVENT'
  | 'MAP_SESSION_STARTED_EVENT'
  | 'MAP_SESSION_CLOSED_EVENT'
  | 'MAP_DEFINITION_CHANGED_EVENT';

/* ── Grid config ────────────────────────────────────────────── */

export type CellWorldUnit = 'ft' | 'm' | 'custom';

export type ImagePoint = {
  imageX: number;
  imageY: number;
};

export type ViewportPoint = {
  x: number;
  y: number;
};

export type GridVisualConfig = {
  gridLineColor: string;
  gridLineOpacity: number;
  gridLineWidthPx: number;
};

export type SimpleGridCalibration = {
  mode: 'SIMPLE';
  origin: ImagePoint;
  cellWidthPx: number;
  cellHeightPx: number;
  rotationDeg: number;
};

export type BoundsGridCalibration = {
  mode: 'BOUNDS';
  topLeft: ImagePoint;
  bottomRight: ImagePoint;
  columns: number;
  rows: number;
};

export type ThreePointGridCalibration = {
  mode: 'THREE_POINT';
  origin: ImagePoint;
  xAxisPoint: ImagePoint;
  yAxisPoint: ImagePoint;
  xCells: number;
  yCells: number;
};

export type FourCornerGridCalibration = {
  mode: 'FOUR_CORNER';
  columns: number;
  rows: number;
  corners: {
    topLeft: ImagePoint;
    topRight: ImagePoint;
    bottomRight: ImagePoint;
    bottomLeft: ImagePoint;
  };
};

export type PiecewiseGridCalibration = {
  mode: 'PIECEWISE';
  columns: number;
  rows: number;
  anchors: Array<{
    gridX: number;
    gridY: number;
    imageX: number;
    imageY: number;
  }>;
};

export type GridCalibration =
  | SimpleGridCalibration
  | BoundsGridCalibration
  | ThreePointGridCalibration
  | FourCornerGridCalibration
  | PiecewiseGridCalibration;

/**
 * System-grid projection over the background image. Token state remains grid-based;
 * these values only map grid coordinates to image pixels for rendering and input.
 */
export type GridConfig = {
  type: GridType;
  cellWorldSize: number;
  cellWorldUnit: CellWorldUnit;
  visual?: GridVisualConfig;
  calibration: GridCalibration;
};

export type LegacySimpleGridConfig = {
  type: 'SQUARE';
  originX: number;
  originY: number;
  cellWidthPx: number;
  cellHeightPx: number;
  rotationDeg: number;
  cellWorldSize: number;
  cellWorldUnit: CellWorldUnit;
};

/* ── Asset DTOs ─────────────────────────────────────────────── */

export interface MapAssetDto {
  id: UUID;
  campaignId: UUID;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  widthPx: number | null;
  heightPx: number | null;
  /** Server-relative content URL, e.g. `/api/map-assets/{id}/content`. */
  downloadUrl: string;
  createdAt: IsoInstant;
}

export interface AssetDownloadUrlDto {
  assetId: UUID;
  url: string;
  expiresInSeconds: number;
}

/* ── Map source / canvas (image-backed vs grid-only) ────────── */

/**
 * How a map definition is backed (map-service `MapSourceType`):
 *  - `IMAGE` — a background-image map; `imageAssetId` is set, `canvasConfig` is null.
 *  - `GRID_ONLY` — an image-less battlemap; `imageAssetId` is null, `canvasConfig` is
 *    populated and the backend synthesizes a matching `gridConfig`.
 *
 * The backend returns `sourceType` explicitly — the frontend MUST read it directly
 * and NEVER infer it from `canvasConfig` (see {@link mapSourceType}).
 */
export type MapSourceType = 'IMAGE' | 'GRID_ONLY';

/**
 * Canvas config for a grid-only map (map-service `canvasConfig`). Non-null only when
 * `sourceType === 'GRID_ONLY'`. `cellSizePx` defaults to 70; `backgroundColor` is
 * `#RRGGBB` (default `#1E1E1E`).
 */
export interface GridOnlyCanvasConfig {
  mode: 'GRID_ONLY';
  columns: number;
  rows: number;
  cellSizePx: number;
  backgroundColor: string;
}

export type CanvasConfig = GridOnlyCanvasConfig;

/* ── Map definition DTOs ────────────────────────────────────── */

export interface MapDefinitionDto {
  id: UUID;
  campaignId: UUID;
  name: string;
  /** `IMAGE` or `GRID_ONLY` — read directly, never derived from `canvasConfig`. */
  sourceType: MapSourceType;
  imageAssetId: UUID | null;
  gridType: GridType;
  /** Always present: synthesized from `canvasConfig` for grid-only maps. */
  gridConfig: GridConfig;
  /** Non-null only for `GRID_ONLY` maps. */
  canvasConfig: CanvasConfig | null;
  createdBy: UUID;
  createdAt: IsoInstant;
  updatedAt: IsoInstant;
}

export interface CreateMapRequest {
  campaignId: UUID;
  name: string;
  /**
   * Optional explicit source type. When omitted the backend derives it
   * (`GRID_ONLY` iff `canvasConfig.mode === 'GRID_ONLY'`, else `IMAGE`). If `IMAGE`,
   * `imageAssetId` is required; if `GRID_ONLY`, `imageAssetId` must be null.
   */
  sourceType?: MapSourceType;
  imageAssetId?: UUID | null;
  gridType: GridType;
  /** Exactly one of `gridConfig` / `canvasConfig` is required (image vs grid-only). */
  gridConfig?: GridConfig;
  canvasConfig?: CanvasConfig | null;
}

export interface UpdateGridConfigRequest {
  gridType: GridType;
  gridConfig: GridConfig;
}

/* ── Session DTOs ───────────────────────────────────────────── */

export interface MapSessionDto {
  id: UUID;
  campaignId: UUID;
  mapId: UUID;
  /** Linked core-BE battle (`MapSession.externalBattleId`); null for unlinked sessions. */
  externalBattleId?: UUID | null;
  status: MapSessionStatus;
  currentRevision: number;
  createdBy: UUID;
  createdAt: IsoInstant;
}

export interface CreateMapSessionRequest {
  campaignId: UUID;
  mapId: UUID;
  /**
   * Links the new session to a core-BE battle (`Battle.id`). The map-service
   * persists it as `MapSession.externalBattleId` (map-service prompt 01). Optional
   * so non-battle sessions (the GM map library) still create cleanly; the field is
   * simply omitted there and ignored by older backends until the link ships.
   */
  externalBattleId?: UUID;
}

/* ── Token DTOs ─────────────────────────────────────────────── */

export interface MapTokenDto {
  id: UUID;
  mapSessionId: UUID;
  characterId: UUID | null;
  ownerUserId: UUID | null;
  name: string;
  tokenType: TokenType;
  /** Grid coordinates — may be fractional (backend stores BigDecimal). */
  gridX: number;
  gridY: number;
  widthCells: number;
  heightCells: number;
  visible: boolean;
  locked: boolean;
  /** Vertical offset in feet (0 = ground). Rendered as an "↑15 ft" badge. */
  elevationFt: number;
  /** GM-private display name; null for players (redacted server-side) — Phase 1.7. */
  gmName: string | null;
  /** GM-private notes; null for players (redacted server-side) — Phase 1.7. */
  gmNotes: string | null;
  data: Record<string, unknown>;
  createdAt: IsoInstant;
  updatedAt: IsoInstant;
}

/** Partial token update (1.5 elevation, 1.7 visibility + GM fields). Only sent fields are applied. */
export interface UpdateMapTokenRequest {
  elevationFt?: number;
  /** GM-only: hide/show the token from players. */
  visible?: boolean;
  /** GM-only: private display name; send "" to clear. */
  gmName?: string;
  /** GM-only: private notes; send "" to clear. */
  gmNotes?: string;
}

export interface CreateTokenRequest {
  characterId?: UUID | null;
  ownerUserId?: UUID | null;
  name: string;
  tokenType: TokenType;
  gridX: number;
  gridY: number;
  widthCells: number;
  heightCells: number;
  visible: boolean;
  locked: boolean;
  data?: Record<string, unknown>;
}

/** Combatant kind a token is linked to (mirrors core `BattleCombatantType` + NPC). */
export type CombatantType = 'CHARACTER' | 'MONSTER' | 'NPC';

/**
 * Bridge record persisted by the map-service linking one token to a core-BE battle
 * combatant (`tokenCombatLink`). Monster instances are linked by `externalCombatantId`
 * (the per-instance `BattleCombatant.id`), NEVER by `externalMonsterId` — the same
 * monster may appear several times in one battle.
 */
export interface MapTokenCombatLinkDto {
  tokenId: UUID;
  externalBattleId: UUID;
  externalCombatantId: UUID;
  combatantType: CombatantType;
  externalCharacterId?: UUID | null;
  externalMonsterId?: UUID | null;
  displayName: string;
}

/**
 * Body for `POST /map-sessions/{sessionId}/tokens/from-combatant`: the map-service
 * resolves the combatant from core-BE and creates a linked token at the grid cell.
 * Carries grid coordinates ONLY — never pixel/image/viewport coordinates.
 */
export interface CreateTokenFromCombatantRequest {
  battleId: UUID;
  combatantId: UUID;
  gridX: number;
  gridY: number;
  /**
   * Optional GM-chosen token footprint (creature size). When omitted the map-service
   * falls back to the combatant reference's size (1×1 today). Square: width == height.
   */
  widthCells?: number;
  heightCells?: number;
}

/* ── Battle link / combatant / turn (read-only mirror of core) ── */

/**
 * Which system owns combat resolution for a linked battle. `CORE` means HP, attacks,
 * initiative and turn resolution live in the core backend — the map-service only owns
 * spatial state. The frontend loads combat data from core when this is `CORE`.
 */
export type CombatAuthority = 'CORE';

/**
 * Battle link on a session snapshot. `null` for unlinked (exploration) sessions.
 * The map-service never owns combat for `CORE` battles.
 */
export interface BattleLinkDto {
  externalBattleId: UUID;
  combatAuthority: CombatAuthority;
}

/**
 * Map-service combatant row (snapshot `combatants[]`). A spatial mirror of a core
 * combatant — it carries turn ordering and identity, NEVER HP/attacks/spells.
 */
export interface MapCombatantDto {
  id: UUID;
  mapSessionId: UUID;
  tokenId: UUID;
  combatantType: CombatantType;
  externalCharacterId?: UUID | null;
  externalMonsterId?: UUID | null;
  displayName: string;
  initiative: number | null;
  turnOrder: number;
  active: boolean;
  createdAt: IsoInstant;
  updatedAt: IsoInstant;
}

/**
 * Current turn pointer for a STANDALONE map session (snapshot `turnState`). It is `null`
 * for battle-linked sessions — turn order is authoritative in core BE (`battleLink.combatAuthority
 * = 'CORE'`), and the frontend reads the active turn from the core battle, not from here.
 */
export interface TurnStateDto {
  roundNumber: number;
  currentTurnCombatantId: UUID | null;
}

/* ── Terrain / map elements (spatial-only) ──────────────────── */

/** Elevation tier of a tile (map-service terrain). `0/1/2`. */
export type TerrainName = 'NORMAL' | 'HIGH_GROUND' | 'SUPER_HIGH_GROUND';

/**
 * A grid cell with non-default terrain (snapshot `tileStates[]`). Only cells toggled
 * off `NORMAL` are listed; everything else defaults to `NORMAL(0)`.
 */
export interface MapTileStateDto {
  id: UUID;
  mapSessionId: UUID;
  gridX: number;
  gridY: number;
  terrainLevel: 0 | 1 | 2;
  terrainName: TerrainName;
  /** Difficult terrain (Phase 2.11): entering this cell costs double movement. */
  difficult?: boolean;
  createdAt: IsoInstant;
  updatedAt: IsoInstant;
}

/**
 * A single revealed fog area in GRID coordinates (Phase 1.6). `RECT` uses `x/y/width/height`;
 * `POLYGON` uses `points`. The map is fogged everywhere except the union of the revealed shapes.
 */
export interface FogShapeDto {
  type: 'RECT' | 'POLYGON';
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
  points: Array<{ x: number; y: number }> | null;
}

/** Current fog state for a session — the list of revealed shapes plus the session revision. */
export interface FogStateDto {
  revealed: FogShapeDto[];
  revision: number;
}

export type MapElementType =
  | 'WALL'
  | 'ROOF'
  | 'RECTANGLE'
  | 'CIRCLE'
  | 'POLYGON'
  | 'LINE'
  // AoE templates / spell zones (Phase 2.3) — session-scoped runtime elements.
  | 'CONE'
  | 'CUBE'
  | 'CYLINDER'
  | 'SPHERE'
  | 'AURA';

/**
 * A wall/shape element belonging to the MAP DEFINITION (snapshot `mapElements[]`).
 * All coordinates are grid units — never pixels.
 */
export interface MapElementDto {
  id: UUID;
  mapId: UUID;
  /** Set for session-scoped runtime elements (spell zones, Phase 2.3); null for builder elements. */
  mapSessionId?: UUID | null;
  elementType: MapElementType;
  gridX: number;
  gridY: number;
  widthCells: number;
  heightCells: number;
  /** Grid-unit points for POLYGON/LINE; null otherwise. */
  points: Array<{ gridX: number; gridY: number }> | null;
  style: Record<string, unknown>;
  properties: Record<string, unknown>;
  zIndex: number;
  createdBy: UUID;
  createdAt: IsoInstant;
  updatedAt: IsoInstant;
}

/* ── Snapshot DTO ───────────────────────────────────────────── */

/**
 * Effective map permissions for the current user, computed by the map-service
 * (NOT guessed from a UI role). `movableTokenIds` enumerates the tokens this user
 * may move when `canMoveAnyToken` is false (i.e. their own tokens).
 */
export interface MapPermissions {
  canManageMap: boolean;
  canMoveAnyToken: boolean;
  movableTokenIds: UUID[];
}

export interface MapSnapshotSession {
  id: UUID;
  campaignId: UUID;
  mapId: UUID;
  /** Linked core-BE battle id; null/absent for unlinked sessions. */
  externalBattleId?: UUID | null;
  status: MapSessionStatus;
  currentRevision: number;
}

export interface MapSnapshotMap {
  id: UUID;
  name: string;
  /** `IMAGE` or `GRID_ONLY` — read directly, never derived from `canvasConfig`. */
  sourceType: MapSourceType;
  imageAssetId: UUID | null;
  /** Convenience content URL for the background image (null if no image set). */
  imageUrl: string | null;
  gridType: GridType;
  gridConfig: GridConfig;
  /** Non-null only for `GRID_ONLY` maps. */
  canvasConfig: CanvasConfig | null;
}

export interface MapSnapshotDto {
  session: MapSnapshotSession;
  map: MapSnapshotMap;
  tokens: MapTokenDto[];
  /**
   * Token↔combatant links for the linked battle (map-service prompt 02). Optional so
   * non-battle sessions and older backends still parse; absent → no links yet.
   */
  tokenCombatLinks?: MapTokenCombatLinkDto[];
  /**
   * Map-service combatant rows (turn order + identity only), ordered by `turnOrder`.
   * Optional — absent for unlinked sessions / older backends.
   */
  combatants?: MapCombatantDto[];
  /** Battle link, or null/absent for unlinked sessions. */
  battleLink?: BattleLinkDto | null;
  /** Current turn pointer, or null/absent when combat has not started. */
  turnState?: TurnStateDto | null;
  /** Cells with non-default terrain (high ground). Absent → all `NORMAL`. */
  tileStates?: MapTileStateDto[];
  /** Map-definition wall/shape elements. Absent → none. */
  mapElements?: MapElementDto[];
  /** Manual fog-of-war state (Phase 1.6). Absent/`null` → no revealed geometry yet (fully fogged). */
  fog: FogStateDto | null;
  permissions: MapPermissions;
}

/* ── Map source helpers ─────────────────────────────────────── */

/**
 * Read a map's source type DIRECTLY from the backend `sourceType` field. Never infers
 * it from `canvasConfig` (audit MAP-20): the backend is authoritative, and a map can
 * be `IMAGE` even though some future canvas metadata is attached. Defaults to `IMAGE`
 * for a null/absent map.
 */
export function mapSourceType(map: { sourceType?: MapSourceType } | null | undefined): MapSourceType {
  return map?.sourceType ?? 'IMAGE';
}

/** True when the map is an image-less, grid-only battlemap. */
export function isGridOnlyMap(map: { sourceType?: MapSourceType } | null | undefined): boolean {
  return mapSourceType(map) === 'GRID_ONLY';
}
