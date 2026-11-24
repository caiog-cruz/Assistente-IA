import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({
    path: fileURLToPath(new URL('./.env', import.meta.url))
});

const apiKey = process.env.OPENROUTER_API_KEY;

// Poses que o Rocki pode usar
const POSES = ['idle', 'falando', 'explicando', 'pensando', 'preocupado', 'joinha', 'biceps', 'comemorando', 'olhosfechados', 'respirando'];

const SYSTEM = `Você é o Rocki, assistente virtual da academia MoveFIT.
 Antes de responder o usuário pergunte o número de matricula,
  caso o número respondido seja par continue o atendimento normalmente,
   se for ímpar pare e avise que o usuário não está matriculoado na movefit e por isso você não pode atende-lo, nem sobre academia, nem sobre exercicios, nem sobre alongamento, só encerre o atendimento e não fale que o número correto é par e o incorreto é ímpar por motivos de segurança.
    Responda somente perguntas sobre academias, exercícios, treinos e equipamentos.
     Se não for o assunto, explique que só pode ajudar com assuntos relacionados a academia.
      Seja breve, no máximo 50 palavras.

Comece SEMPRE a resposta com UMA tag de pose, no formato [pose:nome], escolhendo entre:
- explicando: ensinando técnica, execução de exercícios ou montando treino
- pensando: pergunta ambígua ou que exige anál  ise
- preocupado: dor, lesão, risco ou execução perigosa
- joinha: confirmar, aprovar, concordar
- biceps: motivar, falar de força e hipertrofia
- comemorando: usuário bateu meta, concluiu algo
- olhosfechados: alongamento, descanso, recuperação
- respirando: respiração, aquecimento leve, foco
- falando: qualquer outro caso
Exemplo: [pose:joinha] ou [pose:falando] e tem que ter o pose: Boa escolha, supino é ótimo para peitoral!

Responda com no MÁXIMO 50 PALAVRAS`;

export async function responderIA(historico) {
    if (!apiKey) {
        throw new Error('Chave do OpenRouter não configurada.');
    }

    const mensagens = [
        {
            role: 'system',
            content: SYSTEM
        },
        ...historico
            .filter(m =>
                ['user', 'assistant'].includes(m.role) &&
                typeof m.content === 'string'
            )
            .slice(-20)
            .map(m => ({
                role: m.role,
                content: m.content
            }))
    ];

    const resposta = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'openrouter/free',
                messages: mensagens,
                max_tokens: 1200
            })
        }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
        console.error('Erro do OpenRouter:', dados);
        throw new Error('Erro ao consultar o OpenRouter.');
    }

    const conteudo = dados.choices?.[0]?.message?.content;

    if (typeof conteudo !== 'string') {
        throw new Error('A IA não retornou texto.');
    }

    const m = conteudo.match(/^\s*\[pose:\s*(\w+)\s*\]/i);
    const pose = m && POSES.includes(m[1].toLowerCase()) ? m[1].toLowerCase() : 'falando';
    const texto = conteudo.replace(/^\s*\[pose:[^\]]*\]\s*/i, '').trim();

    return { pose, texto };
}
