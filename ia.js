import 'dotenv/config';
// pra funfar vai precisar instalar o dotenv
// joga esse comando no terminal: npm install dotenv
// pega a api key aqui https://openrouter.ai/
// cria um arquivo .env e coloca dentro: OPENROUTER_API_KEY=sua-chave
// se do nada parar de funcionar é porque deu o limite da chave, só criar uma nova e colar no .env de novo

const apiKey = process.env.OPENROUTER_API_KEY;

export async function responderIA(historico) {
    if (!apiKey) {
        throw new Error('Chave do OpenRouter não configurada.');
    }

    const mensagens = [
        {
            role: 'system',
            content: 'Você é um assistente virtual de uma academia. Responda somente perguntas relacionadas a academias, exercícios físicos, treinos e equipamentos. Se a pergunta não estiver relacionada, explique brevemente que só pode ajudar com assuntos de academia. Responda de forma breve e direta, em no máximo 3 frases.'
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
                max_tokens: 150
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

    return conteudo;
}
