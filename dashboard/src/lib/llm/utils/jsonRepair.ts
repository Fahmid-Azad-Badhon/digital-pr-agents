export function sanitizeAndParseJSON(response: string): { data: any; wasFixed: boolean; original?: string } {
  let cleaned = response.trim()
  
  // Check if response contains markdown code blocks
  const markdownMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (markdownMatch) {
    cleaned = markdownMatch[1]
    console.log('[JSON Repair] Removed markdown code block')
  }
  
  // Check if wrapped in single code block
  if (cleaned.startsWith('```') && cleaned.endsWith('```')) {
    cleaned = cleaned.slice(3, -3).trim()
    console.log('[JSON Repair] Removed single code block')
  }
  
  // Remove trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1')
  
  // Fix common JSON issues
  const original = cleaned
  
  try {
    const parsed = JSON.parse(cleaned)
    return { data: parsed, wasFixed: false }
  } catch {
    // Try to extract just the JSON portion
    const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
    if (jsonMatch) {
      const extracted = jsonMatch[0]
      try {
        const parsed = JSON.parse(extracted)
        console.log('[JSON Repair] Extracted valid JSON from response')
        return { data: parsed, wasFixed: true, original }
      } catch {
        console.log('[JSON Repair] Failed to repair JSON')
      }
    }
  }
  
  return { data: null, wasFixed: true, original }
}
