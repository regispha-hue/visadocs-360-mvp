require('dotenv').config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';

if (!OPENROUTER_API_KEY) {
  console.error('❌ Erro: OPENROUTER_API_KEY não configurada');
  console.error('Crie um arquivo .env com: OPENROUTER_API_KEY=sua_chave');
  process.exit(1);
}

/**
 * Enviar mensagem para OpenRouter
 */
async function sendMessage(userMessage, model = 'openai/gpt-3.5-turbo') {
  try {
    console.log(`📤 Enviando mensagem para ${model}...`);
    
    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/regispha-hue/visadocs-360-mvp',
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: userMessage }],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error (${response.status}): ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error.message);
    throw error;
  }
}

/**
 * Listar modelos disponíveis
 */
async function listModels() {
  try {
    console.log('📋 Listando modelos disponíveis...');
    
    const response = await fetch(`${OPENROUTER_API_URL}/models`, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error (${response.status}): ${error}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('❌ Erro ao listar modelos:', error.message);
    throw error;
  }
}

/**
 * Testar conexão
 */
async function testConnection() {
  try {
    console.log('🔌 Testando conexão com OpenRouter...\n');
    
    const message = await sendMessage('Responda com uma única palavra: OK');
    console.log(`✅ Resposta recebida: ${message}\n`);
    
    return true;
  } catch (error) {
    console.error('❌ Falha na conexão:', error.message);
    return false;
  }
}

// Exportar funções
module.exports = {
  sendMessage,
  listModels,
  testConnection,
};

// Se executado diretamente
if (require.main === module) {
  (async () => {
    const success = await testConnection();
    process.exit(success ? 0 : 1);
  })();
}
