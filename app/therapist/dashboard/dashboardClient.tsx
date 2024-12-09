"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "@/components/overview"
import { RecentSales } from "@/components/recent-sales"
import { CalendarDateRangePicker } from "@/components/date-range-picker"
import { CalendarDays, Upload } from 'lucide-react'
import { useRouter } from "next/navigation"
import { UploadRecordingDialog } from "@/components/upload-recording-dialog"
import { createClient } from "@/utils/supabase/client"
import { DashboardStats } from "@/types/dashboard"
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

interface DashboardClientProps {
    initialData: DashboardData | null;
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
    const router = useRouter()
    const [stats] = useState<DashboardStats>(initialData?.stats || {
        totalClients: 0,
        sessionsThisMonth: 0,
        hoursSpent: 0,
        activeClients: 0,
        clientGrowthRate: 0,
        sessionGrowthRate: 0,
        hoursGrowthRate: 0,
        activeClientsGrowthRate: 0,
    })
    const [therapistName] = useState<string | null>(initialData?.therapistName || null)

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Hey, {therapistName}</h2>
                <div className="flex items-center space-x-2">
                    <UploadRecordingDialog />
                </div>
                {/* will integrate this in next release */}
                {/* <CalendarDateRangePicker /> */}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalClients}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.clientGrowthRate > 0 ? '+' : ''}{stats.clientGrowthRate}% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Sessions
                        </CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <rect width="20" height="14" x="2" y="5" rx="2" />
                            <path d="M2 10h20" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.sessionsThisMonth}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.sessionGrowthRate > 0 ? '+' : ''}{stats.sessionGrowthRate}% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Hours Spent</CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.hoursSpent}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.hoursGrowthRate > 0 ? '+' : ''}{stats.hoursGrowthRate}% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Clients
                        </CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeClients}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.activeClientsGrowthRate > 0 ? '+' : ''}{stats.activeClientsGrowthRate}% from last month
                        </p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <Overview />
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Sessions</CardTitle>
                        <CardDescription>
                            You had {stats.sessionsThisMonth} sessions this month
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RecentSales sessions={initialData?.recentSessions || []} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}