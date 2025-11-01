export function buildSystemPrompt() {
  // Ultra-minimal prompt for sub-2s responses - only essential info
  return `JSON only. Max 4 steps. Schema: {"steps":[{"title":"string","why":"string"}]}`;
}


