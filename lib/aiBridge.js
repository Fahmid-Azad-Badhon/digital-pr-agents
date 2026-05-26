// Mock AI bridge to simulate content generation for MVP
function generate(section, input) {
  const t = new Date().toISOString();
  switch (section) {
    case '01-study-notes':
      return `# Study Notes\nGenerated on ${t}\n\n${input}\n\nNotes: synthetic notes for campaign.`;
    case '02-insights':
      return `# Insights\nGenerated on ${t}\n\nDerived from: 01-study-notes content.\n\nKey insights: synthetic data.`;
    case '03-research':
      return `# Research\nGenerated on ${t}\n\nSynthesis of insights:\n- Point A\n- Point B\n`;
    default:
      return `# ${section}\nGenerated on ${t}\n\n${input || ''}`;
  }
}

module.exports = {
  generate
};
