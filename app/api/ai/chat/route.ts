// app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callAI } from '@/lib/ai-router';

export async function POST(request: NextRequest) {
  try {
    const { message, history = [], context = '' } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Mensagem obrigatória' }, { status: 400 });
    }

    // Montar contexto com histórico
    const historyText = history
      .slice(-10)
      .map((m: any) => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`)
      .join('\n');

    const fullContext = [context, historyText].filter(Boolean).join('\n\n');

    const response = await callAI(message, { context: fullContext });

    return NextResponse.json({
      success: true,
      response: response.content,
      model: response.model,
      tokensUsed: response.tokensUsed,
    });
  } catch (error) {
    console.error('Erro no chat IA:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}