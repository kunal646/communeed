'use client'

import { ClientLayout } from "@/components/client-layout"
import { supabase } from "@/lib/supabase";
import { FileText } from 'lucide-react'
import { useRouter } from "next/navigation";

interface SessionsPageProps {
    params: Promise<{ id: string }>;
}

export default async function SessionsPage({ params }: SessionsPageProps) {
    const router = useRouter();
    const { data: sessions } = await supabase
        .from('sessions')
        .select(`
            *,
            client:clients(
                profile:profiles!clients_profile_id_fkey(full_name)
            ), 
            therapist:profiles (
                id,
                full_name
                )
        `, { count: 'exact' })
        .eq('client_id', (await params).id)
        .order('session_date', { ascending: false });

    return (
        <ClientLayout>
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">Sessions</h2>
                <div className="space-y-4">
                    {sessions?.map(session => (
                        <div
                            onClick={() => router.push(`/therapist/dashboard/sessions/${session.id}`)}
                            key={session.id}
                            className="flex items-center gap-4 p-4 bg-white rounded-lg border hover:bg-gray-50 cursor-pointer"
                        >
                            <FileText className="h-5 w-5 text-gray-400" />
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 text-sm font-medium">
                                        {new Date(session.session_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                                    </span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-sm text-gray-500">
                                        {new Date(session.session_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                    </span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-sm text-gray-500">{session.recording_time} min</span>
                                </div>
                                <p className="text-sm text-gray-500">{session.therapist.full_name}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </ClientLayout>
    )
}
