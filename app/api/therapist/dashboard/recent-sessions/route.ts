import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient();

        // Get the current user's ID
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get current date info for monthly calculations
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        // Fetch recent sessions with client information for current month
        const { data: sessions, error } = await supabase
            .from('sessions')
            .select(`
                *,
                client:clients(
                profile:profiles!clients_profile_id_fkey(full_name)
            )
            `)
            .eq('therapist_id', user.id)
            .gte('session_date', firstDayOfMonth.toISOString())
            .lt('session_date', now.toISOString())
            .order('session_date', { ascending: false })
            .limit(5)
        console.log(sessions)
        if (error) {
            throw error
        }

        return NextResponse.json(sessions)
    } catch (error) {
        console.error('Error fetching recent sessions:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
} 