# 02. API and Type Contracts

Adapt endpoint paths to the actual backend README if they differ.

## Types

```ts
export type UUID = string;

export type GridType = 'SQUARE' | 'HEX_VERTICAL' | 'HEX_HORIZONTAL' | 'FREE';

export type MapSessionStatus = 'ACTIVE' | 'PAUSED' | 'CLOSED';

export type TokenType = 'CHARACTER' | 'NPC' | 'MONSTER' | 'OBJECT';

export type GridConfig = {
  type: GridType;
  originX: number;
  originY: number;
  cellWidthPx: number;
  cellHeightPx: number;
  rotationDeg: number;
  cellWorldSize: number;
  cellWorldUnit: 'ft' | 'm' | 'custom';
};

export type MapAssetDto = {
  id: UUID;
  campaignId: UUID;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  widthPx: number;
  heightPx: number;
  checksumSha256?: string;
  createdBy: UUID;
  createdAt: string;
  downloadUrl?: string;
};

export type MapDefinitionDto = {
  id: UUID;
  campaignId: UUID;
  name: string;
  imageAssetId: UUID | null;
  gridType: GridType;
  gridConfig: GridConfig;
  createdBy: UUID;
  createdAt: string;
  updatedAt: string;
};

export type MapSessionDto = {
  id: UUID;
  campaignId: UUID;
  mapId: UUID;
  status: MapSessionStatus;
  currentRevision: number;
  createdBy: UUID;
  createdAt: string;
  updatedAt: string;
};

export type MapTokenDto = {
  id: UUID;
  mapSessionId: UUID;
  characterId: UUID | null;
  ownerUserId: UUID | null;
  name: string;
  tokenType: TokenType;
  gridX: number;
  gridY: number;
  widthCells: number;
  heightCells: number;
  visible: boolean;
  locked: boolean;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type MapSnapshotDto = {
  map: MapDefinitionDto;
  session: MapSessionDto;
  asset: MapAssetDto | null;
  tokens: MapTokenDto[];
  permissions: MapPermissionsDto;
  currentRevision: number;
};

export type MapPermissionsDto = {
  canView: boolean;
  canManageMap: boolean;
  canManageTokens: boolean;
  canMoveOwnTokens: boolean;
  canMoveAnyToken: boolean;
  isGm: boolean;
};
```

## REST client requirements

Create a dedicated map-service HTTP client.

Do not mix map-service calls into existing core backend clients.

Required functions:

```ts
export interface MapApiClient {
  uploadAsset(campaignId: UUID, file: File): Promise<MapAssetDto>;

  getAsset(assetId: UUID): Promise<MapAssetDto>;
  getAssetContentUrl(assetId: UUID): string;

  listMaps(campaignId: UUID): Promise<MapDefinitionDto[]>;
  createMap(request: CreateMapRequest): Promise<MapDefinitionDto>;
  updateMapGridConfig(mapId: UUID, request: UpdateGridConfigRequest): Promise<MapDefinitionDto>;

  createSession(request: CreateMapSessionRequest): Promise<MapSessionDto>;
  getSnapshot(sessionId: UUID): Promise<MapSnapshotDto>;

  createToken(sessionId: UUID, request: CreateTokenRequest): Promise<MapTokenDto>;
  updateToken(tokenId: UUID, request: UpdateTokenRequest): Promise<MapTokenDto>;
  deleteToken(tokenId: UUID): Promise<void>;
}
```

## REST error format

Frontend must parse a unified error format.

Example:

```ts
export type MapApiError = {
  timestamp?: string;
  status: number;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  requestId?: string;
};
```

Important error codes:

```text
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
VALIDATION_ERROR
REVISION_CONFLICT
TOKEN_LOCKED
MAP_SESSION_CLOSED
ASSET_TOO_LARGE
UNSUPPORTED_IMAGE_TYPE
IMAGE_DIMENSIONS_TOO_LARGE
STORAGE_ERROR
```

## Authentication

Map-service calls must use the same auth token mechanism as the existing application.

Do not create a second login flow.

The API client must attach the same bearer token/cookie strategy already used by the main frontend.

## Snapshot loading

`MapSessionPage` should load snapshot before opening full runtime interactions.

Flow:

```text
1. Read campaignId/sessionId from route.
2. Load core context if needed.
3. Call mapApi.getSnapshot(sessionId).
4. Initialize committed map store.
5. Connect WebSocket.
6. Send JOIN_SESSION.
```
