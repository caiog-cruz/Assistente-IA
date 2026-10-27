import { createServer } from 'node:http';

const server = createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/api/chat') {
        res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8'
        });

        return res.end(JSON.stringify({
            mensagem: 'Rota do chatbot funcionando!'
        }));
    }

    res.writeHead(404, {
        'Content-Type': 'text/plain; charset=utf-8'
    });

    return res.end('Rota não encontrada');
});

server.listen(3333);