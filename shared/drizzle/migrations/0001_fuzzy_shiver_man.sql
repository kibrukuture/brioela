CREATE TYPE "schnl"."account_access_status" AS ENUM('blocked', 'unblocked');--> statement-breakpoint
CREATE TYPE "schnl"."payment_status" AS ENUM('active', 'trialing', 'past_due', 'cancelled', 'expired', 'paused', 'pending', 'failed', 'refunded', 'partially_refunded', 'incomplete');--> statement-breakpoint
CREATE TYPE "schnl"."subscription_platform" AS ENUM('APP_STORE', 'PLAY_STORE', 'STRIPE', 'PADDLE');--> statement-breakpoint
CREATE TYPE "schnl"."subscription_tier" AS ENUM('monthly', 'yearly', 'lifetime', 'weekly');--> statement-breakpoint
CREATE TYPE "schnl"."status" AS ENUM('success', 'partial', 'failed');--> statement-breakpoint
CREATE TYPE "schnl"."user_document_file_type" AS ENUM('pdf', 'image', 'audio', 'video', 'text', 'other');--> statement-breakpoint
CREATE TYPE "schnl"."user_document_processing_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "schnl"."user_alert_type" AS ENUM('critical_lab', 'drug_interaction', 'contraindication');--> statement-breakpoint
CREATE TYPE "schnl"."user_document_extraction_log_processing_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "schnl"."user_document_staging_data_type" AS ENUM('raw_text', 'json', 'embedding');--> statement-breakpoint
CREATE TYPE "schnl"."user_document_staging_stage_name" AS ENUM('ocr', 'translation', 'embedding', 'classification', 'other');--> statement-breakpoint
CREATE TYPE "schnl"."health_record_processing_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "schnl"."health_record_type" AS ENUM('lab_work', 'medications', 'visit_notes', 'imaging', 'prescription', 'other');--> statement-breakpoint
CREATE TYPE "schnl"."pipeline_status" AS ENUM('queued', 'processing', 'completed', 'failed', 'dead_letter');--> statement-breakpoint
CREATE TYPE "schnl"."pipeline_type" AS ENUM('lab_work', 'medication', 'classification');--> statement-breakpoint
CREATE TYPE "schnl"."migration_run_status" AS ENUM('pending', 'running', 'completed', 'failed', 'partial');--> statement-breakpoint
CREATE TYPE "schnl"."migration_error_type" AS ENUM('validation_failed', 'duplicate_key', 'database_error', 'parsing_error', 'missing_required', 'invalid_format');--> statement-breakpoint
CREATE TABLE "schnl"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email_verified" boolean DEFAULT false,
	"image" text,
	"first_name" text,
	"last_name" text,
	"email" text NOT NULL,
	"profile_picture" text,
	"last_paid" timestamp with time zone,
	"phone" text,
	"subscription_end_date" timestamp with time zone,
	"payment_session_id" text,
	"payment_customer_id" text,
	"payment_customer_details" text,
	"payment_subscription_id" text,
	"payment_auth_provider" text,
	"payment_amount_total" text,
	"payment_invoice_id" text,
	"payment_metadata" jsonb,
	"payment_status" "schnl"."payment_status",
	"subscription_platform" "schnl"."subscription_platform",
	"subscription_product_id" text,
	"subscription_product_name" text,
	"subscription_product_price" integer,
	"subscription_product_currency" text,
	"account_access_status" "schnl"."account_access_status",
	"superwall_original_transaction_id" text,
	"superwall_original_app_user_id" text,
	"is_in_trial" boolean DEFAULT false,
	"trial_end_date" timestamp with time zone,
	"subscription_period_type" text,
	"cancelled_at" timestamp with time zone,
	"cancel_reason" text,
	"subscription_environment" text,
	"last_password_change" timestamp with time zone,
	"subscription_tier" "schnl"."subscription_tier",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "schnl"."users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."db_pingers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."db_pingers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."biomarker_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loinc_code" text NOT NULL,
	"loinc_long_name" text NOT NULL,
	"component" text NOT NULL,
	"property" text,
	"time_aspect" text,
	"system" text,
	"scale_type" text,
	"method_type" text,
	"unit_standard" text,
	"data_source" text DEFAULT 'LOINC',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "biomarker_references_loinc_code_unique" UNIQUE("loinc_code")
);
--> statement-breakpoint
ALTER TABLE "schnl"."biomarker_references" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."user_biomarkers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"reported_name" text NOT NULL,
	"reported_unit" text NOT NULL,
	"reported_value" numeric(20, 5) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."user_biomarkers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."drug_contraindications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"medication_id" uuid NOT NULL,
	"contraindication_type" text NOT NULL,
	"condition_name" text NOT NULL,
	"condition_code" text,
	"is_absolute" boolean NOT NULL,
	"rationale" text NOT NULL,
	"alternative_recommendation" text,
	"data_source" text NOT NULL,
	"medical_reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."drug_contraindications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."drug_interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"drug_a_id" uuid NOT NULL,
	"drug_b_id" uuid NOT NULL,
	"interaction_type" text NOT NULL,
	"mechanism" text,
	"clinical_effect" text NOT NULL,
	"evidence_level" text NOT NULL,
	"documentation_quality" text,
	"management_recommendation" text,
	"monitoring_requirement" text,
	"effect_onset" text,
	"effect_duration" text,
	"data_source" text NOT NULL,
	"medical_reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."drug_interactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."medications_reference" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"drug_code" text NOT NULL,
	"drug_code_type" text NOT NULL,
	"normalized_drug_id" text,
	"generic_name" text NOT NULL,
	"brand_names" text[],
	"active_ingredients" jsonb,
	"inactive_ingredients" text[],
	"dosage_form" text,
	"route" text[],
	"strength" text,
	"therapeutic_class" text[],
	"pharmacologic_class" text[],
	"controlled_substance_class" text,
	"boxed_warnings" text[],
	"contraindications" text[],
	"warnings_precautions" text[],
	"adverse_reactions" text[],
	"application_number" text,
	"approval_date" timestamp with time zone,
	"approval_type" text,
	"manufacturer" text,
	"labeler_name" text,
	"data_source" text,
	"last_updated_from_source" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "medications_reference_drug_code_unique" UNIQUE("drug_code")
);
--> statement-breakpoint
ALTER TABLE "schnl"."medications_reference" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."unit_conversions_caches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_unit" text NOT NULL,
	"to_unit" text NOT NULL,
	"multiplier" numeric(20, 10) NOT NULL,
	"loinc_code" text,
	"requires_molecular_weight" boolean DEFAULT false,
	"validated_by" text,
	"last_validated_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."unit_conversions_caches" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."sync_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_name" text NOT NULL,
	"table_name" text NOT NULL,
	"last_sync_at" timestamp with time zone NOT NULL,
	"records_added" integer DEFAULT 0,
	"records_updated" integer DEFAULT 0,
	"records_failed" integer DEFAULT 0,
	"status" "schnl"."status" NOT NULL,
	"error_log" text,
	"source_version" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."sync_metadata" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."user_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"health_record_id" uuid NOT NULL,
	"source_name" text,
	"file_url" text NOT NULL,
	"file_type" "schnl"."user_document_file_type",
	"language" text,
	"uploaded_at" timestamp with time zone,
	"processed_at" timestamp with time zone,
	"status" "schnl"."user_document_processing_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."user_documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."user_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"alert_type" "schnl"."user_alert_type",
	"reference_id" uuid,
	"description" text,
	"acknowledged" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."user_alerts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."user_medications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"medication_reference_id" uuid,
	"dose" text,
	"frequency" text,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."user_medications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."user_biomarker_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"user_biomarker_id" uuid NOT NULL,
	"biomarker_reference_id" uuid NOT NULL,
	"similarity_score" numeric(5, 4),
	"mapping_confidence" numeric(5, 4),
	"translated_name" text,
	"normalized_value" numeric(20, 5),
	"reference_unit" text,
	"min_reference_value" numeric(20, 5),
	"max_reference_value" numeric(20, 5),
	"is_out_of_range" text,
	"needs_review" text,
	"source_format" text,
	"source_language" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."user_biomarker_mappings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."user_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"observation_type" text NOT NULL,
	"observation_value" text NOT NULL,
	"unit" text,
	"observed_at" timestamp with time zone NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."user_observations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."user_document_extraction_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"status" "schnl"."user_document_extraction_log_processing_status" DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"extracted_data" jsonb,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."user_document_extraction_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."user_document_staging" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stage_name" "schnl"."user_document_staging_stage_name" NOT NULL,
	"data_type" "schnl"."user_document_staging_data_type" NOT NULL,
	"data_reference" text NOT NULL,
	"processed_at" timestamp with time zone,
	"pipeline_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."user_document_staging" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."health_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text,
	"record_type" "schnl"."health_record_type",
	"notes" text,
	"status" "schnl"."health_record_processing_status" DEFAULT 'pending' NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."health_records" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."pipeline_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"health_record_id" uuid NOT NULL,
	"pipeline_type" "schnl"."pipeline_type" NOT NULL,
	"current_stage" text NOT NULL,
	"status" "schnl"."pipeline_status" DEFAULT 'queued' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"error_message" text,
	"failed_stage" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "schnl"."pipeline_jobs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."pipeline_stage_artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"stage_name" text NOT NULL,
	"r2_key" text NOT NULL,
	"file_size" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."pipeline_stage_artifacts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."loinc_migration_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_number" integer NOT NULL,
	"status" "schnl"."migration_run_status" DEFAULT 'pending' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"duration_seconds" integer,
	"batch_size" integer NOT NULL,
	"delay_ms" integer NOT NULL,
	"source_file" text NOT NULL,
	"total_records_in_source" integer,
	"total_records_processed" integer DEFAULT 0 NOT NULL,
	"total_records_inserted" integer DEFAULT 0 NOT NULL,
	"total_records_skipped" integer DEFAULT 0 NOT NULL,
	"total_records_errored" integer DEFAULT 0 NOT NULL,
	"last_processed_loinc_code" text,
	"last_processed_line_number" integer,
	"error_summary" jsonb,
	"error_message" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."loinc_migration_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."loinc_migration_errors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"error_type" "schnl"."migration_error_type" NOT NULL,
	"error_message" text NOT NULL,
	"error_details" jsonb,
	"loinc_code" text,
	"line_number" integer NOT NULL,
	"batch_number" integer NOT NULL,
	"raw_data" jsonb NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"resolved" timestamp with time zone,
	"resolved_by" text,
	"resolution_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."loinc_migration_errors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "schnl"."account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"expires_at" timestamp with time zone,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schnl"."verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "schnl"."user_biomarkers" ADD CONSTRAINT "user_biomarkers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "schnl"."drug_contraindications" ADD CONSTRAINT "drug_contraindications_medication_id_medications_reference_id_fk" FOREIGN KEY ("medication_id") REFERENCES "schnl"."medications_reference"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."drug_interactions" ADD CONSTRAINT "drug_interactions_drug_a_id_medications_reference_id_fk" FOREIGN KEY ("drug_a_id") REFERENCES "schnl"."medications_reference"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."drug_interactions" ADD CONSTRAINT "drug_interactions_drug_b_id_medications_reference_id_fk" FOREIGN KEY ("drug_b_id") REFERENCES "schnl"."medications_reference"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."user_documents" ADD CONSTRAINT "user_documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "schnl"."user_documents" ADD CONSTRAINT "user_documents_health_record_id_health_records_id_fk" FOREIGN KEY ("health_record_id") REFERENCES "schnl"."health_records"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "schnl"."user_alerts" ADD CONSTRAINT "user_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "schnl"."user_medications" ADD CONSTRAINT "user_medications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "schnl"."user_medications" ADD CONSTRAINT "user_medications_medication_reference_id_medications_reference_id_fk" FOREIGN KEY ("medication_reference_id") REFERENCES "schnl"."medications_reference"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."user_biomarker_mappings" ADD CONSTRAINT "user_biomarker_mappings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "schnl"."user_biomarker_mappings" ADD CONSTRAINT "user_biomarker_mappings_user_biomarker_id_user_biomarkers_id_fk" FOREIGN KEY ("user_biomarker_id") REFERENCES "schnl"."user_biomarkers"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "schnl"."user_biomarker_mappings" ADD CONSTRAINT "user_biomarker_mappings_biomarker_reference_id_biomarker_references_id_fk" FOREIGN KEY ("biomarker_reference_id") REFERENCES "schnl"."biomarker_references"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "schnl"."user_observations" ADD CONSTRAINT "user_observations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "schnl"."user_document_extraction_logs" ADD CONSTRAINT "user_document_extraction_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "schnl"."user_document_extraction_logs" ADD CONSTRAINT "user_document_extraction_logs_document_id_user_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "schnl"."user_documents"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "schnl"."user_document_staging" ADD CONSTRAINT "user_document_staging_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "schnl"."health_records" ADD CONSTRAINT "health_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "schnl"."pipeline_jobs" ADD CONSTRAINT "pipeline_jobs_health_record_id_health_records_id_fk" FOREIGN KEY ("health_record_id") REFERENCES "schnl"."health_records"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "schnl"."pipeline_stage_artifacts" ADD CONSTRAINT "pipeline_stage_artifacts_job_id_pipeline_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "schnl"."pipeline_jobs"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "schnl"."loinc_migration_errors" ADD CONSTRAINT "loinc_migration_errors_run_id_loinc_migration_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "schnl"."loinc_migration_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."session" ADD CONSTRAINT "session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."account" ADD CONSTRAINT "account_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "medications_reference_drug_code_idx" ON "schnl"."medications_reference" USING btree ("drug_code");--> statement-breakpoint
CREATE INDEX "medications_reference_normalized_drug_id_idx" ON "schnl"."medications_reference" USING btree ("normalized_drug_id");--> statement-breakpoint
CREATE INDEX "medications_reference_generic_name_idx" ON "schnl"."medications_reference" USING btree ("generic_name");--> statement-breakpoint
CREATE INDEX "medications_reference_manufacturer_idx" ON "schnl"."medications_reference" USING btree ("manufacturer");--> statement-breakpoint
CREATE INDEX "loinc_migration_runs_status_idx" ON "schnl"."loinc_migration_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "loinc_migration_runs_started_at_idx" ON "schnl"."loinc_migration_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "loinc_migration_errors_run_id_idx" ON "schnl"."loinc_migration_errors" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "loinc_migration_errors_error_type_idx" ON "schnl"."loinc_migration_errors" USING btree ("error_type");--> statement-breakpoint
CREATE INDEX "loinc_migration_errors_loinc_code_idx" ON "schnl"."loinc_migration_errors" USING btree ("loinc_code");