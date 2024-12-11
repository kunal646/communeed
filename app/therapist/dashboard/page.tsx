import { createClient } from "@/utils/supabase/server"
import DashboardClient from './dashboardClient'
import { DashboardStats } from '@/types/dashboard'
import { RecentSales } from '@/components/recent-sales'
import { cookies, headers } from "next/headers"
interface Session {
    id: string
    session_date: string
    recording_time: number
    client: {
        id: string
        profile: {
            full_name: string
        }
    }
}

interface DashboardData {
    therapistName: string;
    stats: DashboardStats;
    recentSessions: Session[];
}

async function getDashboardData(): Promise<DashboardData | null> {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Get therapist name
    const { data: therapistData, error: therapistError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

    if (therapistError) {
        console.error("Error fetching therapist:", therapistError)
        return null
    }

    // Get current date info for monthly calculations
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // Fetch current month's data
    const { data: currentMonthData, error: currentError } = await supabase
        .from('sessions')
        .select('recording_time')
        .eq('therapist_id', user.id)
        .gte('created_at', firstDayOfMonth.toISOString())
        .lt('created_at', now.toISOString())

    // Fetch last month's data
    const { data: lastMonthData, error: lastError } = await supabase
        .from('sessions')
        .select('recording_time')
        .eq('therapist_id', user.id)
        .gte('created_at', firstDayOfLastMonth.toISOString())
        .lt('created_at', firstDayOfMonth.toISOString())

    // Get total clients for this month
    const { count: totalClientsThisMonth } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('therapist_id', user.id)
        .gte('created_at', firstDayOfMonth.toISOString())
        .lt('created_at', now.toISOString())

    // Get total clients for last month
    const { count: totalClientsLastMonth } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('therapist_id', user.id)
        .gte('created_at', firstDayOfLastMonth.toISOString())
        .lt('created_at', firstDayOfMonth.toISOString())

    // Get active clients for this month
    const { count: activeClientsThisMonth } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('therapist_id', user.id)
        .eq('status', 'active')

    // Get active clients for last month
    const { count: activeClientsLastMonth } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('therapist_id', user.id)
        .eq('status', 'active')

    // Calculate metrics
    const sessionsThisMonth = currentMonthData?.length || 0
    const sessionsLastMonth = lastMonthData?.length || 0

    const hoursSpentThisMonth = (currentMonthData || []).reduce((acc, session) =>
        acc + (session.recording_time || 0), 0) / 60 || 0
    const hoursSpentLastMonth = (lastMonthData || []).reduce((acc, session) =>
        acc + (session.recording_time || 0), 0) / 60 || 0

    // Calculate growth rates
    const calculateGrowthRate = (current: number, previous: number) => {
        if (previous === 0) return 0
        return Number(((current - previous) / previous * 100).toFixed(1))
    }

    const sessionGrowthRate = calculateGrowthRate(sessionsThisMonth, sessionsLastMonth)
    const hoursGrowthRate = calculateGrowthRate(hoursSpentThisMonth, hoursSpentLastMonth)
    const clientGrowthRate = calculateGrowthRate(totalClientsThisMonth || 0, totalClientsLastMonth || 0)
    const activeClientsGrowthRate = calculateGrowthRate(activeClientsThisMonth || 0, activeClientsLastMonth || 0)

    const statsData = {
        totalClients: totalClientsThisMonth || 0,
        sessionsThisMonth,
        hoursSpent: Math.round(hoursSpentThisMonth * 10) / 10, // Round to 1 decimal place
        activeClients: activeClientsThisMonth || 0,
        clientGrowthRate,
        sessionGrowthRate,
        hoursGrowthRate,
        activeClientsGrowthRate,
    }

    // Get recent sessions
    const { data: recentSessions } = await supabase
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

    return {
        therapistName: therapistData.full_name,
        stats: statsData,
        recentSessions: recentSessions || []
    }
}

export default async function DashboardServer() {
    const data = await getDashboardData()
    console.log(data)
    return <DashboardClient initialData={data} />
} 