import { createClient } from '@/utils/supabase/server'
import ClientPageClient from './clientIdClient'

interface ClientServerProps {
    params: { id: string }
}

async function getClientData(clientId: string) {
    const supabase = await createClient()

    const { data: client, error } = await supabase
        .from('clients')
        .select(`
            *,
            profile:profiles!clients_profile_id_fkey(*)
        `)
        .eq('id', clientId)
        .single()

    if (error) {
        console.error("Error fetching client:", error)
        return null
    }

    return client
}
export default async function ClientServer(props: {
    params: Promise<{ id: string }>;
}) {
    const clientData = await getClientData((await props.params).id)
    return <ClientPageClient initialData={clientData} />
}