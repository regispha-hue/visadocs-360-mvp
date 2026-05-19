-- DropEnum
DROP TYPE IF EXISTS "UserRole";

-- RenameIndex
ALTER INDEX IF EXISTS "DocumentLifecycleEvent_tenantId_relatedEntityType_relatedEntity" RENAME TO "DocumentLifecycleEvent_tenantId_relatedEntityType_relatedEn_idx";
