export const tableNames = {
  users: "users",
  dbPingers: "db_pingers",
  biomarkerReferences: "biomarker_references",
  userBiomarkers: "user_biomarkers",
  drugContraindications: "drug_contraindications",
  drugInteractions: "drug_interactions",
  medicationsReferences: "medications_references",
  unitConversionsCache: "unit_conversions_cache",
  syncMetadata: "sync_metadata",
  userDocuments: "user_documents",
  userAlerts: "user_alerts",
  userMedications: "user_medications",
  userBiomarkerMappings: "user_biomarker_mappings",
  userObservations: "user_observations",
  userDocumentExtractionLogs: "user_document_extraction_logs",
  userDocumentStaging: "user_document_staging",
  healthRecords: "health_records",
} as const;

export type TableName = (typeof tableNames)[keyof typeof tableNames];

export const TABLE_NAME_VALUES = Object.values(
  tableNames
) as readonly TableName[];
