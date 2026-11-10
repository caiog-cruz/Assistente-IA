import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { responderIA } from './ia.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, 'public');

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.png':  'image/png',
};

const server = createServer(async (req, res) => {
    let url = req.url.split('?')[0];

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

    if (req.method !== 'GET') {
        res.writeHead(405);
        return res.end('Método não permitido');
    }

    const rota = url === '/' ? '/index.html' : url;
    const arquivo = path.join(PUBLIC, path.normalize(rota));

    if (!arquivo.startsWith(PUBLIC + path.sep)) {
        res.writeHead(403);
        return res.end('Acesso negado');
    }

    try {
        const dados = await readFile(arquivo);
        const tipo = TIPOS[path.extname(arquivo)] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': tipo });
        return res.end(dados);
    } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Não encontrado');
    }
});

server.listen(3333, () => {
    console.log('Servidor rodando em http://localhost:3333');
});