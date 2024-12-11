"use client"

import { useState, useEffect, use } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AudioLines } from 'lucide-react'
import { createClient } from "@/utils/supabase/client"
import { ClientLayout } from "@/components/client-layout"
import ClusteringGraph from '@/components/clusteringGraph'
interface Message {
    client_id: string
    text_message: string | null
    recording_url: string | null
    emotions: string | null
    message_type: 'text' | 'recording'
    event_date: string
}

export default function DailyLogsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const [messages, setMessages] = useState<Message[]>([])
    const supabase = createClient()

    useEffect(() => {
        async function fetchMessages() {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('client_id', resolvedParams.id)
                .order('event_date', { ascending: false })

            if (error) {
                console.error('Error fetching messages:', error)
                return
            }

            setMessages(data || [])
        }

        fetchMessages()

        // Subscribe to new messages
        const channel = supabase
            .channel('messages')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'messages',
                filter: `client_id=eq.${resolvedParams.id}`
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setMessages(prev => [payload.new as Message, ...prev])
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [resolvedParams.id])

    return (
        <ClientLayout>

            <div className="space-y-8">
                <ClusteringGraph />
                <div className="bg-background rounded-lg shadow-sm border border-border">
                    <ScrollArea className="h-[600px]">
                        <div className="p-4 space-y-4">
                            {messages.map((message) => (
                                <div key={message.event_date} className="flex">
                                    <div className="max-w-[80%] p-3 rounded-lg text-sm bg-muted">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-muted-foreground">
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
                                                <div className="text-xs text-muted-foreground">
                                                    {JSON.parse(message.emotions).map((emotion: { name: string, score: number }, index: number) => (
                                                        <span key={emotion.name}>
                                                            {emotion.name}: {emotion.score}%
                                                            {message.emotions && index < JSON.parse(message.emotions).length - 1 && ", "}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </ClientLayout>
    )
} 