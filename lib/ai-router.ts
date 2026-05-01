// lib/ai-router.ts — OpenRouter AI para VISADOCS
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

type AIModel = 'deepseek' | 'qwen' | 'gpt35';

const MODELS: Record<AIModel, string> = {
  deepseek: 'deepseek/deepseek-chat',
  qwen: 'qwen/qwen-72b-chat',
  gpt35: 'openai/gpt-3.5-turbo',
};

const SYSTEM_PROMPT = `Você é o VISA Assistente, especialista em:
- Regulamentação ANVISA (RDC 67/2007, Portaria 344/1998)
- Boas Práticas de Manipulação em Farmácias
- POPs (Procedimentos Operacionais Padrão)
- ISO 9001:2015 - Gestão da Qualidade
- Controle de Qualidade farmacêutico
Responda sempre em português brasileiro, de forma clara e técnica.`;

export interface AIResponse {
  content: string;
  model: string;
  tokensUsed: number;
}

export async function callAI(
  prompt: string,
  options: {
    context?: string;
    model?: AIModel;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  } = {}
): Promise<AIResponse> {
  const {
    context = '',
    model = 'deepseek',
    maxTokens = 2000,
    temperature = 0.7,
    systemPrompt = SYSTEM_PROMPT,
  } = options;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY não configurada');

  const selectedModel = MODELS[model];
  const system = context
    ? `${systemPrompt}\n\nContexto:\n${context}`
    : systemPrompt;

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'X-Title': 'VISADOCS 360',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`OpenRouter ${res.status}: ${JSON.stringify(err)}`);
    }

    const data = await res.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      model: selectedModel,
      tokensUsed: data.usage?.total_tokens || 0,
    };
  } catch (error) {
    if (model === 'deepseek') {
      console.warn('DeepSeek falhou, tentando Qwen...');
      return callAI(prompt, { ...options, model: 'qwen' });
    }
    if (model === 'qwen') {
      console.warn('Qwen falhou, tentando GPT-3.5...');
      return callAI(prompt, { ...options, model: 'gpt35' });
    }
    throw error;
  }
}

export async function generateQuizQuestions(
  titulo: string,
  descricao: string,
  objetivo: string,
  count: number = 5
) {
  const prompt = `Gere ${count} questões de múltipla escolha sobre este POP:
Título: ${titulo}
Objetivo: ${objetivo}
Descrição: ${descricao}

Retorne APENAS JSON válido:
[{"pergunta":"...","alternativas":[{"texto":"...","correta":false},{"texto":"...","correta":true},{"texto":"...","correta":false},{"texto":"...","correta":false}]}]`;

  const res = await callAI(prompt, { temperature: 0.5, maxTokens: 3000 });
  const clean = res.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(clean);
}

export async function analyzeNonConformity(descricao: string, popCodigo: string, setor: string) {
  const prompt = `Analise esta não-conformidade:
POP: ${popCodigo} | Setor: ${setor}
Descrição: ${descricao}

Retorne APENAS JSON:
{"causaRaiz":"...","acoesCorretivas":["..."],"severidadeSugerida":"BAIXO|MEDIO|ALTO|CRITICO","prazoSugerido":"..."}`;

  const res = await callAI(prompt, { temperature: 0.3 });
  const clean = res.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(clean);
}