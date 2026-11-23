import 'dotenv/config';
// pra funfar vai precisar instalar o dotenv
// joga esse comando no terminal: npm install dotenv
// pega a api key aqui https://openrouter.ai/
// cria um arquivo .env e coloca dentro: OPENROUTER_API_KEY=sua-chave
// se do nada parar de funcionar é porque deu o limite da chave, só criar uma nova e colar no .env de novo

const apiKey = process.env.OPENROUTER_API_KEY;

// Poses que o Rocki pode usar
const POSES = ['idle', 'falando', 'explicando', 'pensando', 'preocupado', 'joinha', 'biceps', 'comemorando', 'olhosfechados', 'respirando'];

const SYSTEM = `Você é o Rocki, assistente virtual da academia MoveFIT. Responda somente perguntas sobre academias, exercícios, treinos, equipamentos, dietas e alimentação saudável. Se não for o assunto, explique que só pode ajudar com assuntos relacionados a academia. Sempre lembre de tratar o usuário com calma e gentileza, sendo otimista, enérgico e confiante. Não precisa falar para o usuário que você só fala sobre academias, cumprimente o usuário, pergunte o que ele precisa, se ele perguntar algo além da área de academia, explique que é uma IA assistente apenas para esses assuntos. Seja breve, no máximo 3 frases.

Comece CADA frase com uma tag de pose no formato [pose:nome], escolhendo a pose que combina com o que essa frase diz:
- explicando: ensinando técnica, execução de exercícios ou montando treino
- pensando: pergunta ambígua ou que exige análise
- preocupado: dor, lesão, risco ou execução perigosa
- joinha: confirmar, aprovar, concordar
- biceps: motivar, falar de força e hipertrofia
- comemorando: usuário bateu meta, concluiu algo
- olhosfechados: alongamento, descanso, recuperação
- respirando: respiração, aquecimento leve, foco
- falando: qualquer outro caso
Exemplo: [pose:joinha] Boa escolha, supino é ótimo para peitoral! [pose:explicando] Mantenha as escápulas juntas e desça a barra até o peito. [pose:biceps] Com constância, a força vem rápido!`;

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
