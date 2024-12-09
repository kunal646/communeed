"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Copy, MoreHorizontal, Trash2, Save } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"

interface TranscriptLine {
    speaker: string
    text: string
}

interface SessionData {
    id: string
    client_id: string
    title: string
    clinician_summary: string
    client_summary: string
    session_date: string
    recording_time: number
    session_type: string
    primary_treatment_approach: string
    note_type: string
    setting: string
    recording_transcription: string
    notes: string // JSON stringified object with dynamic keys
    client: {
        profile: {
            full_name: string
        }
    }
}

export default function SessionPage() {
    const { id } = useParams()
    const supabase = createClient()
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [session, setSession] = useState<SessionData | null>(null)
    const [activeTab, setActiveTab] = useState("note")
    const [isEditing, setIsEditing] = useState(false)
    const [noteContent, setNoteContent] = useState<Record<string, string>>({})
    const [summaryContent, setSummaryContent] = useState({
        clinicianSummary: "",
        clientSummary: ""
    })

    useEffect(() => {
        fetchSessionData()
    }, [id])

    const fetchSessionData = async () => {
        try {
            const { data: sessionData, error } = await supabase
                .from('sessions')
                .select(`
                    *,
                    client:clients(
                        profile:profiles!clients_profile_id_fkey(full_name)
                    )
                `, { count: 'exact' })
                .eq('id', id)
                .single()
            if (error) throw error

            setSession(sessionData)

            // Parse note JSON if exists
            try {
                const parsedNote = sessionData.notes ? JSON.parse(sessionData.notes) : {}
                setNoteContent(parsedNote)
            } catch (e) {
                console.error("Error parsing note:", e)
                setNoteContent({})
            }

            setSummaryContent({
                clinicianSummary: sessionData.clinician_summary || '',
                clientSummary: sessionData.client_summary || ''
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load session data",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const { error } = await supabase
                .from('sessions')
                .update({
                    clinician_summary: summaryContent.clinicianSummary,
                    client_summary: summaryContent.clientSummary,
                    notes: JSON.stringify(noteContent),
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)

            if (error) throw error
            toast({
                title: "Success",
                description: "Session updated successfully"
            })
            setIsEditing(false)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save changes",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    const handleAddNoteField = () => {
        const fieldName = prompt("Enter field name:")
        if (fieldName) {
            setNoteContent(prev => ({
                ...prev,
                [fieldName]: ""
            }))
        }
    }

    const handleRemoveNoteField = (key: string) => {
        setNoteContent(prev => {
            const newContent = { ...prev }
            delete newContent[key]
            return newContent
        })
    }

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center">Loading...</div>
    }

    if (!session) {
        return <div className="flex min-h-screen items-center justify-center">Session not found</div>
    }

    // Parse the JSON stringified transcription
    const transcription: TranscriptLine[] = session.recording_transcription ?
        JSON.parse(session.recording_transcription) : []

    return (
        <div className="flex min-h-screen">
            {/* Left Sidebar */}
            <div className="w-64 border-r bg-background p-4">
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Overview</h2>
                    <div className="space-y-2">
                        <div>
                            <span className="text-sm text-muted-foreground">Client: </span>
                            <Link href={`/therapist/dashboard/clients/${session.client_id}`} className="text-sm text-primary hover:underline">
                                {session.client.profile.full_name}
                            </Link>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-sm text-muted-foreground">Date: </span>
                                <span className="text-sm">{new Date(session.session_date).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div>
                            <span className="text-sm text-muted-foreground">Recording Time: </span>
                            <span className="text-sm">{session.recording_time} min</span>
                        </div>
                        <div>
                            <span className="text-sm text-muted-foreground">Setting: </span>
                            <span className="text-sm">{session.setting === 'in_person' ? 'In-person' : 'Telehealth'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex items-center justify-between border-b px-4">
                        <TabsList className="h-12">
                            <TabsTrigger value="note" className="px-4">Note</TabsTrigger>
                            <TabsTrigger value="summary" className="px-4">Summary</TabsTrigger>
                            <TabsTrigger value="transcript" className="px-4">Transcript</TabsTrigger>
                        </TabsList>
                        <div className="flex items-center gap-2">
                            {isEditing ? (
                                <Button
                                    onClick={handleSave}
                                    variant="default"
                                    size="sm"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>Loading...</>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            ) : (
                                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                                    Edit
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="p-6">
                        <TabsContent value="note" className="mt-0 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h1 className="text-2xl font-bold">{session.note_type}</h1>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>{session.session_type}, {session.primary_treatment_approach}</span>
                                </div>

                                {Object.entries(noteContent).map(([key, value], index) => (


                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <h2 className="text-lg font-semibold">{key}</h2>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="sm">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm">
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {isEditing ? (
                                                <div className="space-y-4">

                                                    <Textarea
                                                        key={index}
                                                        value={value}
                                                        onChange={(e) => {
                                                            setNoteContent({
                                                                ...noteContent,
                                                                [key]: e.target.value
                                                            });
                                                        }}
                                                        placeholder={key}
                                                        className="min-h-[200px]"
                                                    />

                                                </div>
                                            ) : (
                                                <div className="space-y-4 text-sm whitespace-pre-line">

                                                    <div key={index} className="space-y-2">
                                                        <div>{value}</div>
                                                    </div>

                                                </div>
                                            )}
                                        </div>
                                    </div>

                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="summary" className="mt-0 space-y-6">
                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h2 className="text-lg font-semibold">Clinician summary</h2>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm">
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    {isEditing ? (
                                        <Textarea
                                            value={summaryContent.clinicianSummary}
                                            onChange={(e) => setSummaryContent({ ...summaryContent, clinicianSummary: e.target.value })}
                                            className="min-h-[300px]"
                                        />
                                    ) : (
                                        <div className="space-y-2 text-sm whitespace-pre-line">
                                            {summaryContent.clinicianSummary}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h2 className="text-lg font-semibold">Client summary</h2>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm">
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    {isEditing ? (
                                        <Textarea
                                            value={summaryContent.clientSummary}
                                            onChange={(e) => setSummaryContent({ ...summaryContent, clientSummary: e.target.value })}
                                            className="min-h-[300px]"
                                        />
                                    ) : (
                                        <div className="space-y-4 text-sm whitespace-pre-line">
                                            {summaryContent.clientSummary}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="transcript" className="mt-0">
                            <div className="space-y-4">
                                {transcription.map((line, index) => (
                                    <div key={index} className="flex gap-4">
                                        <div className="w-20 flex-shrink-0">
                                            <span className="text-sm text-muted-foreground">
                                                <div className="font-medium text-sm">Speaker {line.speaker}</div>
                                            </span>
                                        </div>
                                        <div className="flex-1">

                                            <p className="text-sm">{line.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    )
}
