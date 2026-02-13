export const SENSITIVE_KEYWORDS = [
  'suicide','kill myself','self harm','hurt myself','cutting','overdose','end my life','i want to die','i can’t go on','abuse','assault','rape','violence','stab','hang','jump off','gun','shoot','bully','harassed'
]

export function detectSensitive(text: string): string[] {
  const t = text.toLowerCase()
  return SENSITIVE_KEYWORDS.filter(k => t.includes(k))
}

