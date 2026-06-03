/**
 * Classify document prompt
 * Classifies medical document type
 */

export function getClassifyDocumentPrompt(text: string) {
	return {
		system: `You are a medical document classification expert.

YOUR TASK:
Classify the type of medical document based on its content.

DOCUMENT TYPES:
- lab_work: Laboratory test results, blood work, diagnostic panels
- prescription: Medication prescriptions, pharmacy orders
- medical_report: Doctor's notes, consultation reports, discharge summaries
- imaging_report: X-ray, MRI, CT scan reports
- vaccination_record: Immunization records, vaccine cards
- insurance_card: Health insurance information
- referral: Referral letters to specialists
- consent_form: Medical consent forms
- other: Any other medical document

CLASSIFICATION RULES:
- Provide confidence score between 0 and 1
- Identify if document contains Protected Health Information (PHI)
- Suggest sub-type if applicable (e.g., "Complete Blood Count" for lab_work)

INDICATORS:
- Lab work: Contains test names, values, units, reference ranges
- Prescription: Contains medication names, dosages, "Rx", "Refills"
- Medical report: Contains "Chief Complaint", "Assessment", "Plan"
- Imaging: Contains "Findings", "Impression", imaging modality names`,

		user: `Classify this medical document:\n\n${text}`,
	};
}
