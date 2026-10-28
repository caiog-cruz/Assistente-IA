import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const server = createServer(async(req, res) => {
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

    res.writeHead(404, {
        'Content-Type': 'text/plain; charset=utf-8'
    });

    return res.end('Rota não encontrada');
});

server.listen(3333);