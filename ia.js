import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({
    path: fileURLToPath(new URL('./.env', import.meta.url))
});

const apiKey = process.env.OPENROUTER_API_KEY;

// Poses que o Rocki pode usar
const POSES = ['idle', 'falando', 'explicando', 'pensando', 'preocupado', 'joinha', 'biceps', 'comemorando', 'olhosfechados', 'respirando'];

const SYSTEM = `Você é O Rocki (masculino), assistente virtual da academia MoveFIT.
 Antes de responder o usuário, se apresente e pergunte o número de matricula,
  caso o número respondido seja par continue o atendimento normalmente,
   se for ímpar pare e avise que o usuário não está matriculado na movefit e por isso você não pode atende-lo, nem sobre academia, nem sobre exercicios, nem sobre alongamento, só encerre o atendimento e não fale que o número correto é par e o incorreto é ímpar por motivos de segurança.
    Responda somente perguntas sobre academias, exercícios, treinos, equipamentos, dieta e alimentação saudável.
     Se não for o assunto, explique que só pode ajudar com assuntos relacionados a academia. Lembre de tratar o usuário com gentileza, você é enérgico, confiante e motivador.
      Seja breve, no máximo 50 palavras.

Comece SEMPRE a resposta com UMA tag de pose, no formato [pose:nome], escolhendo entre:
- explicando: ensinando técnica, execução de exercícios ou montando treino
- pensando: pergunta ambígua ou que exige análise
- preocupado: dor, lesão, risco ou execução perigosa
- joinha: confirmar, aprovar, concordar
- biceps: motivar, falar de força e hipertrofia
- comemorando: usuário bateu meta, concluiu algo
- olhosfechados: alongamento, descanso, recuperação
- respirando: respiração, aquecimento leve, foco
- falando: qualquer outro caso

Exemplo: [pose:joinha] ou [pose:falando] e tem que ter o pose: Boa escolha, supino é ótimo para peitoral!

Responda com no MÁXIMO 50 PALAVRAS`;

async function chamarOpenRouter(mensagens) {
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
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
                    max_tokens: 600
                })
            }
        );

        const dados = await resposta.json();
        const conteudo = dados.choices?.[0]?.message?.content;

        if (resposta.ok && typeof conteudo === 'string' && conteudo.trim()) {
            return conteudo;
        }

        console.error(`Tentativa ${tentativa} falhou (status ${resposta.status}):`, JSON.stringify(dados).slice(0, 500));
        await new Promise(r => setTimeout(r, 800 * tentativa));
    }

    throw new Error('OpenRouter falhou após 3 tentativas.');
}

    function extrairSegmentos(conteudo) {
        const segmentos = [];
        const regex = /\[pose:\s*(\w+)\s*\]/gi;
        let pose = 'falando';
        let ultimo = 0;
        let m;

        while ((m = regex.exec(conteudo)) !== null) {
            const trecho = conteudo.slice(ultimo, m.index).trim();
            if (trecho) segmentos.push({ pose, texto: trecho });
            const nome = m[1].toLowerCase();
            pose = POSES.includes(nome) ? nome : 'falando';
            ultimo = regex.lastIndex;
        }

        const resto = conteudo.slice(ultimo).trim();
        if (resto) segmentos.push({ pose, texto: resto });

        return segmentos;
    }

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

    const conteudo = await chamarOpenRouter(mensagens);

    const segmentos = extrairSegmentos(conteudo);
    const texto = segmentos.map(s => s.texto).join(' ');
    const pose = segmentos[0]?.pose || 'falando';

    return { pose, texto, segmentos };
}   
