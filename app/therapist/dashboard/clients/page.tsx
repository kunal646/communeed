import { createClient } from "@/utils/supabase/server"
import { ClientWithProfile } from "@/types/database"
import ClientsClient from './clientsClient'
export const dynamic = 'force-dynamic'
export const revalidate = 0
async function getClientsData() {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Get therapist data
    const { data: therapistData, error: therapistError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq('id', user.id)
        .single()

    if (therapistError) {
        console.error("Error fetching therapist:", therapistError)
        return null
    }

    // Get clients data
    const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select(`
            *,
            profile:profiles!clients_profile_id_fkey(*)
        `)
        .eq('therapist_id', user.id)
        .order("created_at", { ascending: false })

    if (clientsError) {
        console.error("Error fetching clients:", clientsError)
        return null
    }

    return {
        therapistName: therapistData.full_name,
        clients: clientsData as ClientWithProfile[]
    }
}

export default async function ClientsServer() {
    const data = await getClientsData()
    return <ClientsClient initialData={data} />
} 