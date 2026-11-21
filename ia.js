import 'dotenv/config';
// pra funfar vai precisar instalar o dotenv
// joga esse comando no terminal: npm install dotenv
// pega a api key aqui https://openrouter.ai/
// cria um arquivo .env e coloca dentro: OPENROUTER_API_KEY=sua-chave
// se do nada parar de funcionar é porque deu o limite da chave, só criar uma nova e colar no .env de novo

const apiKey = process.env.OPENROUTER_API_KEY;

// Poses que o Rocki pode usar
const POSES = ['idle', 'falando', 'explicando', 'pensando', 'preocupado', 'joinha', 'biceps', 'comemorando', 'olhosfechados', 'respirando'];

const SYSTEM = `Você é o Rocki, assistente virtual da academia MoveFIT. Responda somente perguntas sobre academias, exercícios, treinos e equipamentos. Se não for o assunto, explique que só pode ajudar com assuntos relacionados a academia. Seja breve, no máximo 3 frases.

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
Exemplo: [pose:joinha] Boa escolha, supino é ótimo para peitoral!`;

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
                max_tokens: 200
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
