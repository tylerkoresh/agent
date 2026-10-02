// The working name lives here only. Change it once; nothing else hard-codes it.
export const site = {
  name: "Agent Skills for Founders",
  shortName: "Skills for Founders",
  tagline: "Agent Skills for founders and startups.",
  description:
    "A curated library of Agent Skills for founders and startups: marketing, sales, SEO, research, fundraising and more. Each Skill lists its creator, source, license, compatible agents and verification status.",
} as const;

export function siteUrl(): string {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
