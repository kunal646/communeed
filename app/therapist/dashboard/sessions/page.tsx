import { createClient } from "@/utils/supabase/server"
import SessionsClient from "./sessionClient"
export const dynamic = 'force-dynamic'
export const revalidate = 0
interface SessionsData {
    sessionData: any[];
    therapistName: string;
}

async function getSessionsData(): Promise<SessionsData | null> {
    const supabase = await createClient()
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    const { data: therapistData, error: therapistError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single();

    if (therapistError) {
        console.error("Error fetching therapist:", therapistError);
        return null;
    }

    // Get all sessions for current therapist
    const { data: sessionData, error } = await supabase
        .from('sessions')
        .select(`
            id,
            session_date,
            recording_time,
            status,
            client:clients (
                id,
                profile:profiles!clients_profile_id_fkey (full_name)
            ),
            therapist:profiles (
                id,
                full_name
            )
        `)
        .eq('therapist_id', user?.id)
        .order('session_date', { ascending: true })

    if (error) {
        console.error("Error fetching sessions:", error)
        return null
    }

    return { sessionData, therapistName: therapistData?.full_name }
}

export default async function SessionsServer() {
    const data = await getSessionsData()


    // Pass the data to the client component
    return <SessionsClient initialData={data} />
} 