"use client"

import * as React from "react"
import { CalendarIcon, Mic, Plus, Upload, User, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { createClient } from "@/utils/supabase/client"
import { ClientWithProfile } from "@/types/database"
import { useToast } from "@/hooks/use-toast"
import { AssemblyAI } from 'assemblyai';

interface FormData {
    clientId: string;
    sessionType: string;
    noteType: string;
    treatmentApproach: string;
    setting: string;
    sessionDate: string;
}

interface TranscriptionResult {
    text: string;
    audio_duration: number;
}

export function UploadRecordingDialog() {
    const [open, setOpen] = React.useState(false)
    const [file, setFile] = React.useState<File | null>(null)
    const [clients, setClients] = React.useState<ClientWithProfile[]>([])
    const [loading, setLoading] = React.useState(true)
    const supabase = createClient()
    const [formData, setFormData] = React.useState<FormData>({
        clientId: '',
        sessionType: 'individual',
        noteType: 'SOAP',
        treatmentApproach: 'CBT',
        setting: 'in_person',
        sessionDate: new Date().toISOString().split('T')[0]
    });
    const [isUploading, setIsUploading] = React.useState(false);
    const { toast } = useToast()
    const [currentUser, setCurrentUser] = React.useState<any>(null);

    React.useEffect(() => {
        const fetchClients = async () => {
            // Get current user's ID
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                console.log("No active session. User not signed in.");
                setLoading(false);
                return;
            }

            setCurrentUser(session.user);
            console.log("Authenticated user:", session.user);

            const { data, error } = await supabase
                .from("clients")
                .select(`
                    *,
                    profile:profiles!clients_profile_id_fkey(*)
                `)
                .eq('therapist_id', session.user.id)
                .order("created_at", { ascending: false });

            if (!error && data) {
                setClients(data)
            }
            setLoading(false)
        }
        fetchClients()
    }, [])

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0]
        if (selectedFile && selectedFile.type.startsWith('audio/')) {
            setFile(selectedFile)
        }
    }

    const handleSubmit = async () => {
        if (!file || !formData.clientId || !currentUser) {
            toast({
                title: "Missing Information",
                description: "Please select a file and client before proceeding.",
                variant: "destructive",
            });
            return;
        }

        setIsUploading(true);
        try {
            // 1. Upload file to Supabase Storage
            const fileName = `${Date.now()}-${file.name}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('session-recordings')
                .upload(`recordings/${fileName}`, file);

            if (uploadError) throw uploadError;

            // 2. Get public URL for the uploaded file
            const { data: { publicUrl } } = supabase.storage
                .from('session-recordings')
                .getPublicUrl(`recordings/${fileName}`);
            // 3. First create the session record with 'processing' status
            // Log the SQL query that will be executed
            // console.log('SQL Query:', {
            //     table: 'sessions',
            //     operation: 'INSERT',
            //     values: {
            //         client_id: formData.clientId,
            //         therapist_id: currentUser.id,
            //         recording_url: publicUrl,
            //         session_type: formData.sessionType,
            //         note_type: formData.noteType.toUpperCase(),
            //         primary_treatment_approach: formData.treatmentApproach,
            //         setting: formData.setting.replace('-', '_'),
            //         session_date: formData.sessionDate,
            //         status: 'in_progress',
            //         title: `Session ${new Date(formData.sessionDate).toLocaleDateString()}`
            //     }
            // });

            const { data: sessionData, error: sessionError } = await supabase
                .from('sessions')
                .insert({
                    client_id: formData.clientId,
                    therapist_id: currentUser.id,
                    recording_url: publicUrl,
                    session_type: formData.sessionType,
                    note_type: formData.noteType.toUpperCase(),
                    primary_treatment_approach: formData.treatmentApproach,
                    setting: formData.setting.replace('-', '_'), // Convert 'in-person' to 'in_person'
                    session_date: formData.sessionDate,
                    status: 'in_progress',
                    title: `Session ${new Date(formData.sessionDate).toLocaleDateString()}` // Add required title
                })
                .select()
                .single();

            if (sessionError) throw sessionError;

            // 4. Start transcription process
            const client = new AssemblyAI({
                apiKey: process.env.NEXT_PUBLIC_ASSEMBLY_AI_API_KEY!,
            });

            const transcriptionConfig = {
                audio: publicUrl,
                speaker_labels: true,
                speakers_expected: formData.sessionType === 'individual' ? 2 : 3 // Set speakers based on session type
            };

            // Start transcription
            const transcript = await client.transcripts.transcribe(transcriptionConfig);

            // 5. Update session with transcription and status
            const { error: updateError } = await supabase
                .from('sessions')
                .update({
                    recording_transcription: JSON.stringify(transcript.utterances?.map(utterance => ({
                        speaker: utterance.speaker,
                        text: utterance.text
                    }))),
                    recording_time: transcript.audio_duration ? Math.ceil(transcript.audio_duration / 60) : 0, // Convert seconds to minutes and handle null/undefined
                    status: 'completed'
                })
                .eq('id', sessionData.id);

            if (updateError) throw updateError;

            // 6. Generate notes using the API
            {/* 
                curl -X POST http://localhost:3000/api/sessions/generate-notes \
              -H "Content-Type: application/json" \
              -d '{
                "sessionId": "123",
                "transcription": [
                  {"speaker": "A", "text": "Sample text"},
                  {"speaker": "B", "text": "Another sample"}
                ],
                "noteType": "SOAP"
              }' 
              
              
              */}
            const response = await fetch('/api/sessions/generate-notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: sessionData.id,
                    transcription: transcript.utterances?.map(utterance => ({
                        speaker: utterance.speaker,
                        text: utterance.text
                    })),
                    noteType: formData.noteType
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate notes');
            }

            toast({
                title: "Success",
                description: "Recording uploaded and transcribed successfully.",
            });
            setOpen(false);

        } catch (error) {
            console.error('Error:', error);
            toast({
                title: "Error",
                description: "Failed to process recording. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
        }
    };

    // Update form handlers
    const handleFormChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <>
            {/* <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Upload Recording
            </Button> */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Recording
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                            Upload Recording
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-full"
                                onClick={() => setOpen(false)}
                            >
                                {/* <X className="h-4 w-4" /> */}
                            </Button>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div
                            className={cn(
                                "flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center",
                                "hover:bg-accent transition-colors",
                                "cursor-pointer"
                            )}
                            onClick={() => document.getElementById('audio-upload')?.click()}
                        >
                            <Mic className="mb-4 h-8 w-8 text-blue-500" />
                            <div className="text-sm font-medium">
                                {file ? file.name : "Choose Audio File"}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                                Maximum size: 1GB
                            </div>
                            <input
                                id="audio-upload"
                                type="file"
                                accept="audio/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="client">Client Name:</Label>
                            <Select value={formData.clientId} onValueChange={(value) => handleFormChange('clientId', value)}>
                                <SelectTrigger id="client">
                                    <SelectValue placeholder={loading ? "Loading clients..." : "Select a client"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map((client) => (
                                        <SelectItem key={client.id} value={client.id}>
                                            {client.profile.full_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {/* will add this feature in next release */}
                            {/* <Button variant="link" className="h-auto w-fit p-0">
                                <Plus className="mr-2 h-4 w-4" />
                                Add New Client
                            </Button> */}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="session-type">Session Type:</Label>
                            <Select value={formData.sessionType} onValueChange={(value) => handleFormChange('sessionType', value)}>
                                <SelectTrigger id="session-type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="individual">
                                        <div className="flex items-center">
                                            <User className="mr-2 h-4 w-4" />
                                            Individual
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="couple">Couple</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="note-type">Note Type:</Label>
                            <Select value={formData.noteType} onValueChange={(value) => handleFormChange('noteType', value)}>
                                <SelectTrigger id="note-type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="soap">SOAP</SelectItem>
                                    <SelectItem value="dap">DAP</SelectItem>
                                    <SelectItem value="birp">BIRP</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="treatment-approach">Primary Treatment Approach:</Label>
                            <Select value={formData.treatmentApproach} onValueChange={(value) => handleFormChange('treatmentApproach', value)}>
                                <SelectTrigger id="treatment-approach">
                                    <SelectValue placeholder="Select approach" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CBT">Cognitive Behavioral Therapy</SelectItem>
                                    <SelectItem value="DBT">Dialectical Behavior Therapy</SelectItem>
                                    <SelectItem value="psychodynamic">Psychodynamic</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="setting">Setting:</Label>
                            <Select value={formData.setting} onValueChange={(value) => handleFormChange('setting', value)}>
                                <SelectTrigger id="setting">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="in-person">In-Person</SelectItem>
                                    <SelectItem value="telehealth">Telehealth</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="session-date">Session date:</Label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input id="session-date" type="date" className="pl-10" />
                            </div>
                        </div>
                    </div>

                    <Button
                        className="w-full"
                        disabled={!file || isUploading}
                        onClick={handleSubmit}
                    >
                        {isUploading ? "Processing..." : "Generate Note"}
                    </Button>
                </DialogContent>
            </Dialog>
        </>
    )
}




