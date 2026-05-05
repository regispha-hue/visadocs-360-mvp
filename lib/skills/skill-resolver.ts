// lib/skills/skill-resolver.ts
// Resolver de Skills com cache em memória
// Fail-closed: se skill CANON não disponível, retorna erro (não inventa)

import { fetchSkillCanon, NexoritiaSkill } from "./nexoritia-client";

type CacheItem = {
  skill: NexoritiaSkill;
  exp: number; // timestamp de expiração
};

// Cache em memória (simples, por tenant::slug)
const cache = new Map<string, CacheItem>();

// TTL padrão: 1 minuto (60000ms)
const DEFAULT_TTL_MS = 60000;

export interface ResolvedSkill {
  md: string; // skill content (system prompt)
  title: string;
  slug: string;
  version: string;
  status: string;
}

/**
 * Resolve skill por tenant + slug, com cache
 * Fail-closed: lança erro se skill não puder ser usada
 */
export async function resolveSkill(params: {
  tenantId: string;
  slug: string;
  ttlMs?: number;
}): Promise<ResolvedSkill> {
  const { tenantId, slug, ttlMs = DEFAULT_TTL_MS } = params;
  const cacheKey = `${tenantId}::${slug}`;
  const now = Date.now();

  // Verificar cache
  const cached = cache.get(cacheKey);
  if (cached && cached.exp > now) {
    return {
      md: cached.skill.content,
      title: cached.skill.title,
      slug: cached.skill.slug,
      version: cached.skill.version,
      status: cached.skill.status,
    };
  }

  // Buscar do Nexoritia (ou fallback local)
  try {
    const skill = await fetchSkillCanon(tenantId, slug);

    // Guardar no cache
    cache.set(cacheKey, {
      skill,
      exp: now + ttlMs,
    });

    return {
      md: skill.content,
      title: skill.title,
      slug: skill.slug,
      version: skill.version,
      status: skill.status,
    };
  } catch (error: any) {
    // Limpar cache stale se existir
    cache.delete(cacheKey);

    // Re-lançar erro (fail-closed)
    throw new Error(`Skill resolution failed: ${error.message}`);
  }
}

/**
 * Lista skills disponíveis para um tenant
 * (útil para UI de seleção)
 */
export async function listAvailableSkills(tenantId: string): Promise<
  Array<{
    slug: string;
    title: string;
    description: string;
    status: string;
    category: string;
    icon?: string;
  }>
> {
  // Hardcoded para simulação local
  // Em produção, viria do Nexoritia OS
  return [
    {
      slug: "assistente-rdc67",
      title: "Assistente RDC 67/2007",
      description: "Especialista em Boas Práticas de Manipulação",
      status: "CANON",
      category: "Normas",
      icon: "scale",
    },
    {
      slug: "gerador-quiz-pop",
      title: "Gerador de Quizzes",
      description: "Cria questões de avaliação para POPs",
      status: "CANON",
      category: "Treinamento",
      icon: "help-circle",
    },
    {
      slug: "redator-pop",
      title: "Redator de POPs",
      description: "Ajuda a estruturar e redigir POPs",
      status: "CANON",
      category: "Documentação",
      icon: "file-text",
    },
    {
      slug: "auditor-qualidade",
      title: "Auditor de Qualidade",
      description: "Analisa não-conformidades e sugere ações",
      status: "FROZEN",
      category: "Qualidade",
      icon: "search",
    },
    {
      slug: "monitor-anvisa",
      title: "Monitor ANVISA",
      description: "Atualizações sobre normas e regulamentação",
      status: "CANON",
      category: "Regulatório",
      icon: "bell",
    },
    {
      slug: "guia-visadocs",
      title: "Guia VISADOCS",
      description: "Tutorial e ajuda para usar o sistema",
      status: "CANON",
      category: "Suporte",
      icon: "book-open",
    },
    {
      slug: "especialista-homeopatia",
      title: "Especialista Homeopatia/SBIT",
      description: "Homeopatia e Sistemas Bioterápicos",
      status: "CANON",
      category: "Homeopatia",
      icon: "droplet",
    },
    {
      slug: "especialista-veterinaria",
      title: "Farmácia Veterinária",
      description: "Medicamentos de uso veterinário",
      status: "CANON",
      category: "Veterinária",
      icon: "cat",
    },
    {
      slug: "especialista-citostaticos",
      title: "Citostáticos/Antibióticos/Hormônios",
      description: "Manipulação de medicamentos de alto risco",
      status: "CANON",
      category: "Manipulação Especial",
      icon: "shield-alert",
    },
    {
      slug: "especialista-servicos",
      title: "Serviços Farmacêuticos",
      description: "Serviços e atenção farmacêutica",
      status: "CANON",
      category: "Serviços",
      icon: "heart-pulse",
    },
  ];
}

/**
 * Limpa cache de skills (útil para hot-reload em dev)
 */
export function clearSkillCache(): void {
  cache.clear();
}

/**
 * Verifica se skill está em cache
 */
export function isSkillCached(tenantId: string, slug: string): boolean {
  const cacheKey = `${tenantId}::${slug}`;
  const cached = cache.get(cacheKey);
  if (!cached) return false;
  return cached.exp > Date.now();
}
