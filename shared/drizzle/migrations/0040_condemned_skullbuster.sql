DROP TABLE "schnl"."biomarker_references" CASCADE;--> statement-breakpoint
DROP TABLE "schnl"."user_biomarkers" CASCADE;--> statement-breakpoint
DROP TABLE "schnl"."drug_contraindications" CASCADE;--> statement-breakpoint
DROP TABLE "schnl"."drug_interactions" CASCADE;--> statement-breakpoint
DROP TABLE "schnl"."medications_reference" CASCADE;--> statement-breakpoint
DROP TABLE "schnl"."unit_conversions_caches" CASCADE;--> statement-breakpoint
DROP TABLE "schnl"."sync_metadata" CASCADE;--> statement-breakpoint
DROP TABLE "schnl"."user_documents" CASCADE;--> statement-breakpoint
DROP TABLE "schnl"."user_alerts" CASCADE;--> statement-breakpoint
DROP TABLE "schnl"."user_medications" CASCADE;--> statement-breakpoint
DROP TABLE "schnl"."user_biomarker_mappings" CASCADE;--> statement-breakpoint
DROP TABLE "schnl"."user_observations" CASCADE;--> statement-breakpoint
DROP TABLE "schnl"."user_document_extraction_logs" CASCADE;--> statement-breakpoint
DROP TABLE "schnl"."user_document_staging" CASCADE;--> statement-breakpoint
DROP TABLE "schnl"."health_records" CASCADE;--> statement-breakpoint
DROP TABLE "schnl"."pipeline_jobs" CASCADE;--> statement-breakpoint
DROP TABLE "schnl"."pipeline_stage_artifacts" CASCADE;--> statement-breakpoint
DROP TABLE "schnl"."loinc_migration_runs" CASCADE;--> statement-breakpoint
DROP TABLE "schnl"."loinc_migration_errors" CASCADE;--> statement-breakpoint
DROP TYPE "schnl"."status";--> statement-breakpoint
DROP TYPE "schnl"."user_document_file_type";--> statement-breakpoint
DROP TYPE "schnl"."user_document_processing_status";--> statement-breakpoint
DROP TYPE "schnl"."user_alert_type";--> statement-breakpoint
DROP TYPE "schnl"."user_document_extraction_log_processing_status";--> statement-breakpoint
DROP TYPE "schnl"."user_document_staging_data_type";--> statement-breakpoint
DROP TYPE "schnl"."user_document_staging_stage_name";--> statement-breakpoint
DROP TYPE "schnl"."health_record_processing_status";--> statement-breakpoint
DROP TYPE "schnl"."health_record_type";--> statement-breakpoint
DROP TYPE "schnl"."pipeline_status";--> statement-breakpoint
DROP TYPE "schnl"."pipeline_type";--> statement-breakpoint
DROP TYPE "schnl"."migration_run_status";--> statement-breakpoint
DROP TYPE "schnl"."migration_error_type";