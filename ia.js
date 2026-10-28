import 'dotenv/config';

const apiKey = process.env.OPENROUTER_API_KEY;

export async function responderIA(historico) {
    const chave = chaveDeFora()
    if (!chave) {
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
                'Authorization': `Bearer ${chave}`,
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