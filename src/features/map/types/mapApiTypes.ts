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

/* ── Map definition DTOs ────────────────────────────────────── */

export interface MapDefinitionDto {
  id: UUID;
  campaignId: UUID;
  name: string;
  imageAssetId: UUID | null;
  gridType: GridType;
  gridConfig: GridConfig;
  createdBy: UUID;
  createdAt: IsoInstant;
  updatedAt: IsoInstant;
}

export interface CreateMapRequest {
  campaignId: UUID;
  name: string;
  imageAssetId?: UUID | null;
  gridType: GridType;
  gridConfig: GridConfig;
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
  data: Record<string, unknown>;
  createdAt: IsoInstant;
  updatedAt: IsoInstant;
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
  status: MapSessionStatus;
  currentRevision: number;
}

export interface MapSnapshotMap {
  id: UUID;
  name: string;
  imageAssetId: UUID | null;
  /** Convenience content URL for the background image (null if no image set). */
  imageUrl: string | null;
  gridType: GridType;
  gridConfig: GridConfig;
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
  /** Fog-of-war state — unused in MVP, shape intentionally opaque. */
  fog: unknown | null;
  permissions: MapPermissions;
}
