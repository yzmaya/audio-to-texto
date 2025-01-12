import OpenAI from 'openai';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Patrones para detectar presentaciones
const presentationPatterns = [
    /(?:me llamo|soy|mi nombre es)\s+([A-ZÁ-Úa-zá-ú\s]+)(?:\s+y)?/i,
    /(?:me presento|me presento como)\s+([A-ZÁ-Úa-zá-ú\s]+)(?:\s+y)?/i,
    /(?:mi función|mi cargo|trabajo como|soy el|soy la)\s+([A-ZÁ-Úa-zá-ú\s]+)(?:\s+y)?/i
];

async function transcribeAudio(audioPath) {
    try {
        console.log('Verificando archivo de audio...');
        if (!fs.existsSync(audioPath)) {
            throw new Error(`El archivo ${audioPath} no existe`);
        }

        console.log('Iniciando transcripción...');
        const audioFile = fs.createReadStream(audioPath);
        const response = await openai.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-1',
            language: 'es',
            response_format: 'text'
        });

        // Procesar la transcripción para detectar nombres
        const segments = response.split(/[.!?]+/);
        let currentSpeaker = "Persona 1";
        let speakerMap = new Map();
        let processedText = "";

        for (const segment of segments) {
            if (segment.trim() === "") continue;

            // Buscar patrones de presentación
            for (const pattern of presentationPatterns) {
                const match = segment.match(pattern);
                if (match && match[1]) {
                    const name = match[1].trim()
                        .replace(/\s+y\s+.*$/, '')
                        .replace(/\s+[,.]\s*.*$/, '');
                    currentSpeaker = name;
                    speakerMap.set(name, true);
                    break;
                }
            }

            processedText += `[${currentSpeaker}]: ${segment.trim()}.\n\n`;
        }

        // Guardar la transcripción
        const outputPath = audioPath.replace(/\.[^/.]+$/, '_transcripcion.txt');
        fs.writeFileSync(outputPath, processedText);

        console.log('Transcripción completada y guardada en:', outputPath);
        return processedText;

    } catch (error) {
        console.error('Error durante la transcripción:', error.message);
        if (error.response) {
            console.error(error.response.data);
        }
        throw error;
    }
}

// Uso del script
const audioFile = 'C:\\Users\\NéstorIvánYzmayaTari\\Videos\\entrevista.mp3';

transcribeAudio(audioFile)
    .then(transcription => {
        console.log('Proceso completado exitosamente');
    })
    .catch(error => {
        console.error('Error:', error);
    });