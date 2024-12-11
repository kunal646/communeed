"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"


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

export function Overview({ sessions }: { sessions: Session[] }) {
    // Get dates for last week (Monday to Sunday)
    const today = new Date()
    const currentDay = today.getDay()
    const diff = currentDay === 0 ? 6 : currentDay - 1 // Adjust to get Monday
    const monday = new Date(today)
    monday.setDate(today.getDate() - diff)
    monday.setHours(0, 0, 0, 0)

    // Create array of last week's dates
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const weekData = weekDays.map((day, index) => {
        const date = new Date(monday)
        date.setDate(monday.getDate() + index)

        // Count sessions for this day
        const sessionsCount = sessions.filter(session => {
            const sessionDate = new Date(session.session_date)
            return sessionDate.toDateString() === date.toDateString()
        }).length

        return {
            name: day,
            total: sessionsCount
        }
    })

    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={weekData}>
                <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                />
                <Bar
                    dataKey="total"
                    fill="currentColor"
                    radius={[4, 4, 0, 0]}
                    className="fill-primary"
                />
            </BarChart>
        </ResponsiveContainer>
    )
} 