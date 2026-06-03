/**
 * Standardize units prompt
 * Converts measurement units to standard format
 */

export interface StandardizeUnitsInput {
	value: number;
	from_unit: string;
	to_unit: string;
	biomarker_name?: string;
}

export function getStandardizeUnitsPrompt(input: StandardizeUnitsInput) {
	return {
		system: `You are a medical unit conversion expert.

YOUR TASK:
Convert measurement values between different units accurately.

CONVERSION RULES:
- Use precise conversion factors
- Maintain significant figures
- For molar conversions (mmol/L ↔ mg/dL), molecular weight is required
- Common conversions:
  • Glucose: mmol/L × 18 = mg/dL
  • Cholesterol: mmol/L × 38.67 = mg/dL
  • Triglycerides: mmol/L × 88.57 = mg/dL
  • Creatinine: μmol/L ÷ 88.4 = mg/dL

EXAMPLES:
1. Convert 5.5 mmol/L glucose to mg/dL
   → 5.5 × 18 = 99 mg/dL

2. Convert 1.2 mg/dL creatinine to μmol/L
   → 1.2 × 88.4 = 106.08 μmol/L`,

		user: `Convert ${input.value} ${input.from_unit} to ${input.to_unit}${input.biomarker_name ? ` for ${input.biomarker_name}` : ''}`,
	};
}
