// Eu fiz um sistema pra voz do Rocki
// Pra vc colocar pra funcionar, vá para o elevenlabs.io, faça uma conta e crie uma API Key, colando ela no .env como: ELEVENLABS_API_KEY=sua chave
// Depois, vá em voices e procure pela voz Charlie - Deep, Confident, Energetic, vá nos três pontinhos e copie o voice ID, colocando no .env como: ELEVENLABS_VOICE_ID=sua chave

import 'dotenv/config';

const apiKey = process.env.ELEVENLABS_API_KEY;
const voiceId = process.env.ELEVENLABS_VOICE_ID;

export async function gerarVoz(texto) {
    if (!apiKey || !voiceId) {
        throw new Error('Chave ou voz da ElevenLabs não configurada. Leia o voz.js para saber como configurar!');
    }

    const resposta = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
                Accept: 'audio/mpeg'
            },
            body: JSON.stringify({
                text: texto,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                    speed: 5.0
                }
            })
        }
    );

    if (!resposta.ok) {
        console.error('Erro da ElevnLabs: ', await resposta.text());
        throw new Error('Erro ao gerar a voz.');
    }

    return Buffer.from(await resposta.arrayBuffer());
}
