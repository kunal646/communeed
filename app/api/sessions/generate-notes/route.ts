export const maxDuration = 60;

import { createClient } from '@/utils/supabase/server'
import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

interface TranscriptUtterance {
    speaker: string;
    text: string;
}

interface SOAPNotes {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
}

interface DAPNotes {
    data: string;
    assessment: string;
    plan: string;
}

interface BIRPNotes {
    behavior: string;
    intervention: string;
    response: string;
    plan: string;
}

type NotesFormat = SOAPNotes | DAPNotes | BIRPNotes;

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { sessionId, transcription, noteType } = await req.json()

        // Parse the transcription if it's a string
        const utterances: TranscriptUtterance[] = typeof transcription === 'string' 
            ? JSON.parse(transcription) 
            : transcription

        // Combine utterances into a single conversation string
        const conversationText = utterances
            .map(u => `${u.speaker}: ${u.text}`)
            .join('\n')
        // console.log(utterances)
        // console.log(conversationText)
        // Generate clinician summary
        const clinicianSummaryPrompt = `
            OBJECTIVE:
            Extract a concise, professional summary of the therapy session from the clinician's perspective.

            REQUIRED COMPONENTS:
            1. Core Psychological Focus:
            - Identify primary psychological themes or challenges discussed
            - Highlight key therapeutic observations
            - Capture client's current emotional/mental state

            2. Therapeutic Approach:
            - Note specific therapeutic techniques used
            - Outline interventions or strategies introduced
            - Identify potential treatment directions

            3. Clinical Insights:
            - Summarize significant therapeutic moments
            - Capture emerging psychological patterns
            - Note critical clinical observations

            GUIDELINES:
            - Use professional, objective clinical language
            - Maintain client confidentiality
            - Focus on therapeutic process and insights
            - Limit to 3-5 key bullet points
            - Each point should be 1-2 lines maximum
            - Avoid personally identifying details
            - Emphasize clinical perspective and assessment

            FORMATTING:
            - Concise, clear professional language
            - Neutral, analytical tone
            - Evidence-based observations
            - Forward-looking treatment considerations

            Please provide your response without using markdown formatting.

            Transcript:
            ${conversationText}
        `

        const clinicianSummaryResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: clinicianSummaryPrompt }],
            temperature: 0.7,
        })

        // Generate client summary
        const clientSummaryPrompt = `
            OBJECTIVE:
            Capture the client's emotional journey, personal insights, and subjective experience of the therapy session.

            KEY NARRATIVE ELEMENTS:
            1. Emotional Landscape:
            - Describe primary emotional states
            - Capture current personal challenges
            - Reflect internal psychological experience

            2. Personal Insights:
            - Identify self-discoveries
            - Highlight moments of personal reflection
            - Note emerging self-understanding

            3. Therapeutic Impact:
            - Summarize personal takeaways
            - Capture emotional response to interventions
            - Reflect on potential personal growth

            GUIDELINES:
            - Use compassionate, person-centered language
            - Capture subjective emotional experience
            - Maintain client's voice and perspective
            - Limit to 3-5 key points
            - Each point should be 1-2 lines maximum
            - Reflect empathy and personal journey
            - Avoid clinical jargon

            FORMATTING:
            - Authentic personal narrative
            - Empathetic, supportive tone
            - Emphasize client's emotional experience
            - Focus on personal meaning and growth

            Please provide your response without using markdown formatting.

            Transcript:
            ${conversationText}
        `

        const clientSummaryResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: clientSummaryPrompt }],
            temperature: 0.7,
        })

        // Generate structured notes based on note type
        let notesPrompt = ''
        switch (noteType.toUpperCase()) {
            case 'SOAP':
                notesPrompt = `
                    Create a SOAP note from this therapy session transcript.
                    Format as JSON with these keys:
                    - subjective: Write client's statements, complaints, and history as a single paragraph in plain English
                    - objective: Write observable facts and findings as a single paragraph in plain English
                    - assessment: Write clinical analysis and interpretation as a single paragraph in plain English
                    - plan: Write treatment plan and next steps as a single paragraph in plain English

                    All fields should be plain text strings, not objects or lists.
                    Please provide your response without using markdown formatting.
                    
                    Transcript:
                    ${conversationText}
                `
                break;
            case 'DAP':
                notesPrompt = `
                    Create a DAP note from this therapy session transcript.
                    Format as JSON with these keys:
                    - data: Write objective and subjective information as a single paragraph in plain English
                    - assessment: Write clinical interpretation as a single paragraph in plain English
                    - plan: Write treatment plan and interventions as a single paragraph in plain English

                    All fields should be plain text strings, not objects or lists.
                    Please provide your response without using markdown formatting.

                    Transcript:
                    ${conversationText}
                `
                break;
            case 'BIRP':
                notesPrompt = `
                    Create a BIRP note from this therapy session transcript.
                    Format as JSON with these keys:
                    - behavior: Write client's behavior and statements as a single paragraph in plain English
                    - intervention: Write therapeutic interventions used as a single paragraph in plain English
                    - response: Write client's response to interventions as a single paragraph in plain English
                    - plan: Write future treatment plans as a single paragraph in plain English

                    All fields should be plain text strings, not objects or lists.
                    Please provide your response without using markdown formatting.

                    Transcript:
                    ${conversationText}
                `
                break;
        }

        const notesResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: notesPrompt }],
            temperature: 0.7,
        })
        console.log(notesResponse.choices[0].message.content,clinicianSummaryResponse.choices[0].message.content,clientSummaryResponse.choices[0].message.content)
        // Parse the structured notes response
        const notes: NotesFormat = JSON.parse(
            notesResponse.choices[0].message.content || '{}'
        )

        // Update the session in the database
        const { error: updateError } = await supabase
            .from('sessions')
            .update({
                clinician_summary: clinicianSummaryResponse.choices[0].message.content,
                client_summary: clientSummaryResponse.choices[0].message.content,
                notes: JSON.stringify(notes)
            })
            .eq('id', sessionId)

        if (updateError) {
            throw updateError
        }

        return NextResponse.json({
            success: true,
            clinician_summary: clinicianSummaryResponse.choices[0].message.content,
            client_summary: clientSummaryResponse.choices[0].message.content,
            notes
        })
        // return NextResponse.json({
        //     success: true,
        //     utterances,
        //     conversationText
        // })

    } catch (error) {
        console.error('Error generating notes:', error)
        return NextResponse.json(
            { error: 'Failed to generate notes' },
            { status: 500 }
        )
    }
} 
