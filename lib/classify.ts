const RULES: Array<{ category: string; words: string[]; domains?: string[] }> = [
  { category: "Design", words: ["design", "ui", "ux", "graphic", "typography", "branding", "illustration", "behance", "dribbble", "figma"], domains: ["behance.net", "dribbble.com", "figma.com"] },
  { category: "Development", words: ["github", "gitlab", "api", "javascript", "typescript", "react", "next.js", "python", "developer", "programming"], domains: ["github.com", "gitlab.com", "stackoverflow.com"] },
  { category: "Learning", words: ["course", "tutorial", "learn", "lesson", "documentation", "guide", "how to"], domains: ["coursera.org", "udemy.com", "developer.mozilla.org"] },
  { category: "Articles", words: ["article", "blog", "news", "research", "essay", "medium"], domains: ["medium.com", "substack.com"] },
  { category: "Video", words: ["video", "watch", "youtube", "vimeo"], domains: ["youtube.com", "youtu.be", "vimeo.com"] },
  { category: "Inspiration", words: ["inspiration", "inspiring", "reference", "moodboard", "portfolio", "creative"] },
  { category: "Tools", words: ["tool", "app", "software", "generator", "template", "resource"], domains: ["producthunt.com"] },
];

export function classifyLink(url: string, title: string, description = "") {
  const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  const text = `${host} ${title} ${description}`.toLowerCase();
  for (const rule of RULES) {
    if (rule.domains?.some((d) => host === d || host.endsWith(`.${d}`)) ||
        rule.words.some((word) => text.includes(word))) {
      return rule.category;
    }
  }
  return "Other";
}

export function makeTags(url: string, title: string, category: string) {
  const host = new URL(url).hostname.replace(/^www\./, "");
  const tokens = `${title} ${category}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 3)
    .filter((t) => !["with", "from", "this", "that", "your", "about"].includes(t));
  return [...new Set([host.split(".")[0], ...tokens])].slice(0, 8);
}
