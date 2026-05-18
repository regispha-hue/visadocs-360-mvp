# API Contracts: Biblioteca documental com POPs assistidos

All routes require an authenticated session. Non-`SUPER_ADMIN` users are always
scoped to `session.user.tenantId`. `SUPER_ADMIN` routes require an explicit
`tenantId` selector for tenant-scoped data. Error responses must not reveal
cross-tenant record existence.

## GET /api/document-library

Browse/search tenant documentary library items.

**Query**:

- `search`: optional text query
- `type`: optional document type
- `status`: optional lifecycle status
- `category`: optional category/sector
- `tenantId`: optional, `SUPER_ADMIN` only

**Response 200**:

```json
{
  "items": [
    {
      "id": "lib_123",
      "type": "POP_MODEL",
      "title": "Recebimento de Materias-Primas",
      "code": "POP.001",
      "category": "Almoxarifado e Estoque",
      "status": "ACTIVE",
      "version": "1.0",
      "updatedAt": "2026-05-18T12:00:00.000Z"
    }
  ]
}
```

## POST /api/document-library

Create/import a tenant library item. Allowed for RT/admin roles.

**Request**:

```json
{
  "type": "POP_MODEL",
  "title": "Recebimento de Materias-Primas",
  "code": "POP.001",
  "category": "Almoxarifado e Estoque",
  "version": "1.0",
  "content": "Texto fonte revisavel",
  "status": "ACTIVE"
}
```

**Response 201**:

```json
{
  "success": true,
  "item": {
    "id": "lib_123",
    "status": "ACTIVE"
  }
}
```

## POST /api/pops/assisted-drafts

Create an assisted POP draft from selected library sources. Result is always a
draft/minuta and never an approved POP.

**Request**:

```json
{
  "title": "POP de Recebimento de Materias-Primas",
  "code": "POP.001",
  "sector": "Almoxarifado e Estoque",
  "sourceIds": ["lib_123"],
  "generationMode": "LIBRARY_ASSISTED"
}
```

**Response 201**:

```json
{
  "success": true,
  "draft": {
    "id": "draft_123",
    "status": "DRAFT",
    "regulatoryNotice": "Minuta auxiliar sujeita a revisao e aprovacao do RT.",
    "sourceCount": 1,
    "insufficientSources": false
  }
}
```

**Failure 422** when sources are insufficient:

```json
{
  "error": "Base documental insuficiente para gerar minuta assistida"
}
```

## PATCH /api/pops/{id}

Update draft or POP metadata/content. Existing route should preserve tenant check
and add lifecycle/audit events for status and version changes.

**Rules**:

- Non-RT users cannot approve or make a POP current.
- Status changes to approved/current must use `/api/pops/{id}/approve`.
- Draft edits must not alter approved historical versions.

## POST /api/pops/{id}/approve

RT approval/rejection decision for a draft POP.

**Request**:

```json
{
  "decision": "APPROVED",
  "version": "1.0",
  "notes": "Revisado e aprovado para uso interno",
  "effectiveFrom": "2026-05-18"
}
```

**Response 200**:

```json
{
  "success": true,
  "approvedVersion": {
    "id": "apv_123",
    "popId": "pop_123",
    "version": "1.0",
    "status": "CURRENT",
    "approvedByUserId": "user_123",
    "approvedAt": "2026-05-18T12:00:00.000Z"
  }
}
```

**Failure 403** when user is not RT:

```json
{
  "error": "Apenas o Responsavel Tecnico pode aprovar POPs para uso operacional"
}
```

## GET /api/pops/{id}/history

Return lifecycle events and approved versions for a POP.

**Response 200**:

```json
{
  "pop": {
    "id": "pop_123",
    "code": "POP.001",
    "title": "POP de Recebimento"
  },
  "versions": [
    {
      "id": "apv_123",
      "version": "1.0",
      "status": "CURRENT",
      "approvedAt": "2026-05-18T12:00:00.000Z"
    }
  ],
  "events": [
    {
      "id": "evt_123",
      "action": "APPROVED",
      "userName": "RT Farmacia",
      "createdAt": "2026-05-18T12:00:00.000Z",
      "toStatus": "CURRENT"
    }
  ]
}
```

## POST /api/treinamentos

Existing training creation route must accept/resolve an approved POP version and
reject drafts, rejected or unapproved POPs.

**Request addition**:

```json
{
  "popId": "pop_123",
  "approvedPopVersionId": "apv_123",
  "colaboradorId": "colab_123",
  "dataTreinamento": "2026-05-18",
  "instrutor": "RT Farmacia",
  "status": "PENDENTE"
}
```

**Failure 422** when POP is not approved/current:

```json
{
  "error": "Treinamentos internos exigem POP aprovado pelo RT"
}
```

## Security and audit requirements

- Every mutating route writes `AuditLog` and `DocumentLifecycleEvent`.
- Responses never include raw prompts, provider payloads, env vars, tokens,
  internal logs or records from other tenants.
- User-facing messages must use auxiliary/draft/internal-record language.
