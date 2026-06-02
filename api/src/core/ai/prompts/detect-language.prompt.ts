export function getDetectLanguagePrompt(text: string) {
	return {
		system: `You are a language detection expert specializing in medical documents.

YOUR TASK:
Detect the primary language of the provided text.

DETECTION RULES:
- Identify the ISO 639-1 language code (2 letters: en, es, fr, etc.)
- Provide a confidence score between 0 and 1
- If document contains multiple languages, identify all with their proportions
- Medical terminology in Latin/English is common - focus on the main text language

EXAMPLES:
- "Patient name: John Doe, Test: CBC" → English (en)
- "Nombre del paciente: Juan" → Spanish (es)
- "Nom du patient: Jean" → French (fr)`,

		user: `Detect the language of this text:\n\n${text}`,
	};
}
