"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AudioLines, Mic, Send, Volume2, Info } from 'lucide-react'
import { createClient } from "@/utils/supabase/client"
import { Badge } from "@/components/ui/badge"
interface Message {
    client_id: string;
    text_message: string | null;
    recording_url: string | null;
    emotions: string | null;
    message_type: 'text' | 'recording';
    event_date: string;
}
import { AssemblyAI } from 'assemblyai'

const HUME_API_KEY = process.env.NEXT_PUBLIC_HUME_API_KEY;
const HUME_WS_URL = `wss://api.hume.ai/v0/stream/models?apikey=${HUME_API_KEY}`;

const getSignificantEmotions = (emotions: Array<{ name: string, score: number }>) => {
    // Sort emotions by score and get top emotions with score > 0.1 (10%)
    return emotions
        .filter(e => e.score > 0.1)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(e => ({
            name: e.name,
            score: Math.round(e.score * 100)
        }));
};

export function Chat({ initialMessages, clientId }: { initialMessages: Message[], clientId: string }) {
    const supabase = createClient()

    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const [input, setInput] = useState("")
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTooLong, setRecordingTooLong] = useState(false)
    const mediaRecorder = useRef<MediaRecorder | null>(null)
    const audioChunks = useRef<Blob[]>([])
    const wsRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const recordingStartTime = useRef<number>(0);
    const client = new AssemblyAI({
        apiKey: process.env.NEXT_PUBLIC_ASSEMBLY_AI_API_KEY!,
    });
    useEffect(() => {
        const connectWebSocket = () => {
            const ws = new WebSocket(HUME_WS_URL);

            ws.onopen = () => {
                console.log('WebSocket connected');
                setIsConnected(true);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('Received data:', data);

                    if (data.language?.predictions) {
                        console.log('Received');
                        setMessages(prevMessages => {
                            const updatedMessages = [...prevMessages];
                            const lastMessage = updatedMessages[updatedMessages.length - 1];
                            let is_inserted = false;

                            if (is_inserted === false && lastMessage && data.language.predictions[0]?.emotions) {
                                const significantEmotions = getSignificantEmotions(data.language.predictions[0].emotions);
                                lastMessage.emotions = JSON.stringify(significantEmotions);

                                // Insert message in Supabase
                                const insertMessage = async () => {
                                    console.log('Inserting message in Supabase');

                                    const { error: messageError } = await supabase
                                        .from('messages')
                                        .upsert(lastMessage, { onConflict: 'event_date' })
                                        .single();

                                    if (messageError) console.error(messageError);
                                }
                                insertMessage();
                                is_inserted = true;
                            }
                            return updatedMessages;
                        });
                    }
                    else if (data.prosody?.predictions) {
                        console.log('Received');

                        setMessages(prevMessages => {
                            const updatedMessages = [...prevMessages];
                            const lastMessage = updatedMessages[updatedMessages.length - 1];
                            let is_inserted = false;
                            if (is_inserted === false && lastMessage && data.prosody.predictions[0]?.emotions) {
                                const significantEmotions = getSignificantEmotions(data.prosody.predictions[0].emotions);
                                lastMessage.emotions = JSON.stringify(significantEmotions);

                                // Insert message in Supabase
                                const insertMessage = async () => {
                                    console.log('Inserting message in Supabase');

                                    const { error: messageError } = await supabase
                                        .from('messages')
                                        .upsert(lastMessage, { onConflict: 'event_date' })
                                        .single()

                                    if (messageError) console.error(messageError);
                                }
                                insertMessage();
                                is_inserted = true;
                            }
                            return updatedMessages;
                        });
                    }
                } catch (error) {
                    console.error('Error processing WebSocket message:', error);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                setIsConnected(false);
            };

            ws.onclose = () => {
                console.log('WebSocket closed');
                setIsConnected(false);
                // Attempt to reconnect after a delay
                setTimeout(connectWebSocket, 3000);
            };

            wsRef.current = ws;

            // Set up ping interval to prevent timeout
            const pingInterval = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: "ping" }));
                }
            }, 45000); // Ping every 45 seconds

            return () => {
                clearInterval(pingInterval);
                ws.close();
            };
        };

        connectWebSocket();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    const analyzeTextEmotions = async (text: string) => {
        if (!wsRef.current || !isConnected) {
            throw new Error('WebSocket not connected');
        }

        try {
            wsRef.current.send(JSON.stringify({
                models: {
                    language: {
                        "granularity": "sentence"
                    }
                },
                raw_text: true,
                data: text
            }));
        } catch (error) {
            console.error('Error sending text analysis request:', error);
            throw error;
        }
    };

    const analyzeAudioEmotions = async (audioBlob: Blob) => {
        if (!wsRef.current || !isConnected) {
            throw new Error('WebSocket not connected');
        }

        try {
            const arrayBuffer = await audioBlob.arrayBuffer();
            const base64Audio = Buffer.from(arrayBuffer).toString('base64');

            wsRef.current.send(JSON.stringify({
                models: {
                    prosody: {}
                },
                data: base64Audio
            }));
        } catch (error) {
            console.error('Error sending audio analysis request:', error);
            throw error;
        }
    };

    const handleSendMessage = async () => {
        if (input.trim()) {
            try {

                const newMessage: Message = {
                    client_id: clientId,
                    text_message: input.trim(),
                    recording_url: null,
                    message_type: 'text',
                    emotions: null, // Will be updated when we receive the prediction
                    event_date: new Date().toISOString(),
                };
                setMessages([...messages, newMessage]);
                await analyzeTextEmotions(input.trim());




                setInput("");
            } catch (error) {
                console.error('Error processing message:', error);
            }
        }
    };

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            audioChunks.current = [];
            recordingStartTime.current = Date.now();
            setRecordingTooLong(false);

            mediaRecorder.current.ondataavailable = (event) => {
                audioChunks.current.push(event.data);
            };

            mediaRecorder.current.onstop = async () => {
                const recordingDuration = Date.now() - recordingStartTime.current;
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });

                try {
                    const fileName = `recording_${Date.now()}.wav`;
                    const { data, error } = await supabase.storage
                        .from('chat_recordings')
                        .upload(fileName, audioBlob);

                    if (error) throw error;

                    const { data: { publicUrl } } = supabase.storage
                        .from('chat_recordings')
                        .getPublicUrl(fileName);

                    const transcriptionConfig = {
                        audio: publicUrl,
                    };

                    const transcript = await client.transcripts.transcribe(transcriptionConfig);
                    const transcribedText = transcript.text || '';

                    const newRecording: Message = {
                        client_id: clientId,
                        text_message: transcribedText,
                        recording_url: publicUrl,
                        emotions: null,
                        message_type: 'recording',
                        event_date: new Date().toISOString(),
                    };

                    setMessages([...messages, newRecording]);

                    if (recordingDuration <= 5000) {
                        await analyzeAudioEmotions(audioBlob);
                    } else {
                        setRecordingTooLong(true);
                        // Save message to Supabase without emotions
                        const { error: messageError } = await supabase
                            .from('messages')
                            .upsert(newRecording, { onConflict: 'event_date' })
                            .single();

                        if (messageError) console.error(messageError);
                    }

                } catch (error) {
                    console.error('Error processing recording:', error);
                }

                stream.getTracks().forEach(track => track.stop());
            }

            mediaRecorder.current.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error starting recording:', error);
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
            mediaRecorder.current.stop()
            setIsRecording(false)
        }
    }


    return (

        <div className="bg-background rounded-lg shadow-sm border border-border">
            <ScrollArea className="h-auto">
                <div className="p-4 space-y-4 ">
                    {messages.map((message) => (
                        <div key={message.event_date} className="flex justify-end">
                            <div className="max-w-[80%] p-3 rounded-lg text-sm bg-muted">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs opacity-70">
                                        {new Date(message.event_date).toLocaleString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                    {message.message_type === 'recording' && (
                                        <span className="ml-2">
                                            <AudioLines className="h-3 w-3" />
                                        </span>
                                    )}
                                </div>
                                <p>{message.text_message}</p>
                                {message.emotions && (
                                    <div className="mt-2">
                                        <div className="text-xs opacity-70">
                                            {JSON.parse(message.emotions).map((emotion: { name: string, score: number }, index: number) => (
                                                <span key={emotion.name}>
                                                    {emotion.name}: {emotion.score}%
                                                    {message.emotions && index < JSON.parse(message.emotions).length - 1 && ", "}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {/* {!message.emotions && recordingTooLong && (
                                    <div className="flex items-center justify-center text-sm text-destructive">
                                        <Info className="h-4 w-4 mr-2" />
                                        For now, we only support short recordings under 5 seconds.
                                    </div>
                                )} */}


                            </div>
                        </div>
                    ))}

                </div>
            </ScrollArea>
            <div className="flex items-center p-4 border-t border-border">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-grow"
                />
                <Button onClick={handleSendMessage} size="icon" variant="ghost" className="ml-2">
                    <Send className="h-4 w-4" />
                </Button>
                <Button
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    size="icon"
                    variant={isRecording ? "destructive" : "ghost"}
                    className="ml-2"
                >
                    <Mic className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}