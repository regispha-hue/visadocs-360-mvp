// lib/skills/index.ts
// Exportações públicas do sistema de Skills Canônicas

export {
  fetchSkillCanon,
  type NexoritiaSkill,
  type SkillStatus,
} from "./nexoritia-client";

export {
  resolveSkill,
  listAvailableSkills,
  clearSkillCache,
  isSkillCached,
  type ResolvedSkill,
} from "./skill-resolver";
