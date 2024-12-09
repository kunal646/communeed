import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientDashboardClient } from "./clientDashboardClient"
import { createClient } from "@/utils/supabase/server"
import { redirect } from 'next/navigation'
export default async function ClientDashboard() {
    const supabase = await createClient()

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return null
    }
    // Get client ID from clients table
    const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('profile_id', user.id)
        .single()

    if (!clientData) {
        return null
    }

    // Get user's role from profiles
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role === 'therapist') {
        // Redirect therapists away from client dashboard

        redirect('/therapist/dashboard')
    }

    // Fetch initial messages
    const { data: initialMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('client_id', clientData?.id)
        .order('created_at', { ascending: true })

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <ClientDashboardClient
                initialMessages={initialMessages ?? []}
                clientId={clientData?.id}
            />
        </div>
    )
}
