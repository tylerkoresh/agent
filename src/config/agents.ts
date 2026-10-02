// Controlled vocabulary of agents a Skill can list compatibility for.
// Adding an agent here is the only change needed to make it selectable.
export const AGENTS = [
  { id: "claude-code", name: "Claude Code" },
  { id: "codex", name: "Codex" },
  { id: "cursor", name: "Cursor" },
  { id: "gemini-cli", name: "Gemini CLI" },
  { id: "github-copilot", name: "GitHub Copilot" },
  { id: "other", name: "Other agent" },
] as const;

export type AgentId = (typeof AGENTS)[number]["id"];
export const AGENT_IDS = AGENTS.map((a) => a.id) as [AgentId, ...AgentId[]];

export function agentName(id: string): string {
  return AGENTS.find((a) => a.id === id)?.name ?? id;
}

// "tested": the marketplace team ran it on this agent.
// "declared": the creator or source states it works; we have not tested it.
export const EVIDENCE = ["tested", "declared"] as const;
export type Evidence = (typeof EVIDENCE)[number];
