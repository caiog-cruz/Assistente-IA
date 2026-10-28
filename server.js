import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { responderIA } from './ia.js';

const server = createServer(async (req, res) => {

    // Abrir o site
    if (req.method === 'GET' && req.url === '/') {
        try {
            const html = await readFile('./index.html', 'utf8');

            res.writeHead(200, {
                'Content-Type': 'text/html; charset=utf-8'
            });

            return res.end(html);

        } catch (erro) {
            res.writeHead(500, {
                'Content-Type': 'text/plain; charset=utf-8'
            });

            return res.end('Erro ao carregar o HTML');
        }
    }

    // Enviar mensagem para a IA
    if (req.method === 'POST' && req.url === '/api/chat') {
        try {
            let corpo = '';

            for await (const parte of req) {
                corpo += parte;
            }

            const dados = JSON.parse(corpo);

            if (!Array.isArray(dados.messages)) {
                res.writeHead(400, {
                    'Content-Type': 'application/json; charset=utf-8'
                });

                return res.end(JSON.stringify({
                    error: 'Histórico de mensagens inválido.'
                }));
            }

            const respostaIA = await responderIA(dados.messages);

            res.writeHead(200, {
                'Content-Type': 'application/json; charset=utf-8'
            });

            return res.end(JSON.stringify({
                content: respostaIA
            }));

        } catch (erro) {
            console.error('Erro na rota /api/chat:', erro);

            res.writeHead(500, {
                'Content-Type': 'application/json; charset=utf-8'
            });

            return res.end(JSON.stringify({
                error: 'Erro ao processar a mensagem.'
            }));
        }
    }

    // Rota não encontrada
    res.writeHead(404, {
        'Content-Type': 'text/plain; charset=utf-8'
    });

    return res.end('Rota não encontrada');
});

server.listen(3333, () => {
    console.log('Servidor rodando em http://localhost:3333');
});