import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('authError', authError)
    console.log('user', user)
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const therapistId = user.id
    // Get current date info for monthly calculations
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    // Fetch current month's data
    const { data: currentMonthData, error: currentError } = await supabase
        .from('sessions')
        .select('recording_time')
        .eq('therapist_id', therapistId)
        .gte('created_at', firstDayOfMonth.toISOString())
        .lt('created_at', now.toISOString())

    // Fetch last month's data
    const { data: lastMonthData, error: lastError } = await supabase
        .from('sessions')
        .select('recording_time')
        .eq('therapist_id', therapistId)
        .gte('created_at', firstDayOfLastMonth.toISOString())
        .lt('created_at', firstDayOfMonth.toISOString())

    // Get total clients for this month
    const { count: totalClientsThisMonth } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('therapist_id', therapistId)
        .gte('created_at', firstDayOfMonth.toISOString())
        .lt('created_at', now.toISOString())

    // Get total clients for last month
    const { count: totalClientsLastMonth } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('therapist_id', therapistId)
        .gte('created_at', firstDayOfLastMonth.toISOString())
        .lt('created_at', firstDayOfMonth.toISOString())

    // Get active clients for this month
    const { count: activeClientsThisMonth } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('therapist_id', therapistId)
        .eq('status', 'active')

    // Get active clients for last month
    const { count: activeClientsLastMonth } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('therapist_id', therapistId)
        .eq('status', 'active')

    // Calculate metrics
    const sessionsThisMonth = currentMonthData?.length || 0
    const sessionsLastMonth = lastMonthData?.length || 0
    
    const hoursSpentThisMonth = (currentMonthData ?? []).reduce((acc, session) =>
        acc + (session.recording_time || 0), 0) / 60 || 0
    const hoursSpentLastMonth = (lastMonthData ?? []).reduce((acc, session) =>
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

    return NextResponse.json({
        totalClients: totalClientsThisMonth || 0,
        sessionsThisMonth,
        hoursSpent: Math.round(hoursSpentThisMonth * 10) / 10, // Round to 1 decimal place
        activeClients: activeClientsThisMonth || 0,
        clientGrowthRate,
        sessionGrowthRate,
        hoursGrowthRate,
        activeClientsGrowthRate,
    })
}