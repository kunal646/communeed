"use client"
import { ClientLayout } from "@/components/client-layout"
import { use, useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend
} from 'recharts'

// Add type for Goal
type Goal = {
    id: number
    client_id: string
    goal: string
    target: number
    target_duration: 'daily' | 'weekly'
    created_at: string
    updated_at: string
}

type GoalProgress = Goal & {
    progress: number
    percentage: number
}

type DailyStats = {
    date: string
    'Positive self-talk': number
    'good mood': number
}

export function AnalyticsClient({ initialGoalsData, dailyStats }: { initialGoalsData: GoalProgress[], dailyStats: DailyStats[] }) {
    const [goals, setGoals] = useState<GoalProgress[]>(initialGoalsData)
    const dailyGoals = goals.filter(goal => goal.target_duration === 'daily')
    const weeklyGoals = goals.filter(goal => goal.target_duration === 'weekly')

    return (
        <ClientLayout>
            <div className="space-y-8">
                {/* <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold tracking-tight">Client Analytics</h2>
                </div> */}

                {/* Daily Goals Section */}
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Daily Goals</h3>
                    {dailyGoals.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                            {dailyGoals.map((goal) => (
                                <div
                                    key={goal.id}
                                    className="flex items-center gap-4 p-3 rounded-md hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{goal.goal}</p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <Progress value={goal.percentage} className="h-1.5 flex-1" />
                                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                                                {goal.progress} / {goal.target}
                                                {goal.progress > goal.target && (
                                                    <span className="text-green-500 ml-1"> ↑</span>
                                                )}
                                                {goal.progress < goal.target && (
                                                    <span className="text-red-500 ml-1"> ↓</span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No daily goals set</p>
                    )}
                </div>

                {/* Weekly Goals Section */}
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Weekly Goals</h3>
                    {weeklyGoals.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                            {weeklyGoals.map((goal) => (
                                <div
                                    key={goal.id}
                                    className="flex items-center gap-4 p-3 rounded-md hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{goal.goal}</p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <Progress value={goal.percentage} className="h-1.5 flex-1" />
                                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                                                {goal.progress} / {goal.target}
                                                {goal.progress > goal.target && (
                                                    <span className="text-green-500 ml-1"> ↑</span>
                                                )}
                                                {goal.progress < goal.target && (
                                                    <span className="text-red-500 ml-1"> ↓</span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No weekly goals set</p>
                    )}
                </div>


                {/* Mood Trendline */}
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Mood Journey (Last 7 Days)</CardTitle>
                        <CardDescription>Track how client's mood changes over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dailyStats}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip
                                        content={({ payload, label }) => {
                                            if (payload && payload.length && payload[0]?.value) {
                                                return (
                                                    <div className="bg-background p-2 border rounded-lg shadow-sm">
                                                        <p className="font-medium">
                                                            {new Date(label).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </p>
                                                        <p>Good Mood: {Number(payload[0].value).toFixed(1)}%</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Line type="monotone" dataKey="good mood" stroke="#8884d8" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Self-Talk Analysis */}
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Self-Talk Patterns</CardTitle>
                        <CardDescription>Monitor client's internal dialogue</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dailyStats}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip
                                        content={({ payload, label }) => {
                                            if (payload && payload.length && payload[0]?.value) {
                                                return (
                                                    <div className="bg-background p-2 border rounded-lg shadow-sm">
                                                        <p className="font-medium">
                                                            {new Date(label).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </p>
                                                        <p>Positive Self-talk: {Number(payload[0].value).toFixed(1)}%</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="Positive self-talk" fill="#82ca9d" name="Positive Self-talk %" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </ClientLayout>
    )
} 