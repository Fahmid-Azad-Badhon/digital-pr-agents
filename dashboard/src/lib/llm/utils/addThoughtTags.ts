/**
 * Prompt modifier to request <thought> tags from models
 */
export function addThoughtTags(prompt: string): string {
  return `${prompt}

Before giving your final answer, wrap your reasoning in <thought> tags:
<thought>
Explain your reasoning process, what data you're using, and why you're making certain decisions.
</thought>

Now provide your final response:`
}
