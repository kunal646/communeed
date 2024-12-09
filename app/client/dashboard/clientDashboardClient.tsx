"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Analytics } from "@/components/analytics"
import { Chat } from "@/components/chat"


interface Message {
    client_id: string;
    text_message: string | null;
    recording_url: string | null;
    emotions: string | null;
    message_type: 'text' | 'recording';
    event_date: string;
}

interface ClientDashboardClientProps {
    initialMessages: Message[]
    clientId: string
}

export function ClientDashboardClient({ initialMessages, clientId }: ClientDashboardClientProps) {
    const [activeTab, setActiveTab] = useState("chat")

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chat">Chat Log</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            <TabsContent value="chat">
                <Chat initialMessages={initialMessages} clientId={clientId} />
            </TabsContent>
            <TabsContent value="analytics">
                <Analytics />
            </TabsContent>
        </Tabs>
    )
}
