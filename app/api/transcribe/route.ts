import { AssemblyAI } from 'assemblyai'
import { NextResponse } from 'next/server';

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY!;
const client = new AssemblyAI({
    apiKey: ASSEMBLYAI_API_KEY
});

export async function POST(request: Request) {
    try {
        const { audioUrl, sessionType } = await request.json();

        const params = {
            audio: audioUrl,
            speaker_labels: true,
            speakers_expected: sessionType === 'individual' ? 2 : 3 // 2 for individual (client + therapist), 3 for couples
        };

        const transcript = await client.transcripts.transcribe(params);
        return NextResponse.json(transcript);

    } catch (error) {
        console.error('Transcription error:', error);
        return NextResponse.json(
            { error: 'Failed to process transcription' },
            { status: 500 }
        );
    }
} 