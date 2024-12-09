"use client"

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

export default function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const [timeframe, setTimeframe] = useState<'week' | 'month'>('week')

    // Weekly Scorecard Data
    const weeklyScorecard = [
        {
            metric: "Mood Stability",
            current: 6,
            target: 3,
            progress: 50,
            unit: "points"
        },
        {
            metric: "Negative Self-Talk",
            current: 30,
            target: 10,
            progress: 67,
            unit: "%"
        },
        {
            metric: "Binge Episodes",
            current: 2,
            target: 1,
            progress: 75,
            unit: "per week"
        },
        {
            metric: "Mindfulness Practice",
            current: 2,
            target: 3,
            progress: 66,
            unit: "days"
        }
    ]

    // Mood Trendline Data
    const moodTrendData = [
        { day: "Mon", mood: 6, event: "Family dinner" },
        { day: "Tue", mood: 4, event: "Failed test" },
        { day: "Wed", mood: 7, event: null },
        { day: "Thu", mood: 5, event: "Social media trigger" },
        { day: "Fri", mood: 8, event: "Therapy session" },
        { day: "Sat", mood: 6, event: null },
        { day: "Sun", mood: 4, event: "Skipped meal" }
    ]

    // Coping Tools Data
    const copingToolsData = [
        {
            tool: "Journaling",
            usageCount: 2,
            moodImprovement: 2,
            effectiveness: 40
        },
        {
            tool: "Mindfulness",
            usageCount: 3,
            moodImprovement: 4,
            effectiveness: 80
        },
        {
            tool: "Breathing Exercises",
            usageCount: 1,
            moodImprovement: 1,
            effectiveness: 20
        }
    ]

    // Positive Self-Talk Data
    const selfTalkData = [
        { day: "Mon", positive: 30, negative: 70 },
        { day: "Tue", positive: 45, negative: 55 },
        { day: "Wed", positive: 60, negative: 40 },
        { day: "Thu", positive: 40, negative: 60 },
        { day: "Fri", positive: 70, negative: 30 },
        { day: "Sat", positive: 55, negative: 45 },
        { day: "Sun", positive: 35, negative: 65 }
    ]

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Client Analytics</h2>
                <Select value={timeframe} onValueChange={(value: 'week' | 'month') => setTimeframe(value)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="week">Last 7 days</SelectItem>
                        <SelectItem value="month">Last 30 days</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Weekly Scorecard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {weeklyScorecard.map((item) => (
                    <Card key={item.metric}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">{item.metric}</CardTitle>
                            <CardDescription>
                                Current: {item.current} {item.unit} → Target: {item.target} {item.unit}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Progress value={item.progress} className="h-2" />
                            <p className="text-sm text-muted-foreground mt-2">
                                Progress: {item.progress}% completed
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Mood Trendline */}
            <Card>
                <CardHeader>
                    <CardTitle>Mood Trendline</CardTitle>
                    <CardDescription>Daily mood fluctuations with significant events</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={moodTrendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis domain={[0, 10]} />
                                <Tooltip
                                    content={({ payload, label }) => {
                                        if (payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-background p-2 border rounded-lg shadow-sm">
                                                    <p className="font-medium">{label}</p>
                                                    <p>Mood: {data.mood}/10</p>
                                                    {data.event && <p>Event: {data.event}</p>}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Line type="monotone" dataKey="mood" stroke="#8884d8" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Coping Tools Effectiveness */}
            <Card>
                <CardHeader>
                    <CardTitle>Coping Tools Effectiveness</CardTitle>
                    <CardDescription>Usage frequency and mood improvement</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={copingToolsData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" domain={[0, 100]} />
                                <YAxis dataKey="tool" type="category" />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="effectiveness" fill="#8884d8" name="Effectiveness %" />
                                <Bar dataKey="usageCount" fill="#82ca9d" name="Usage Count" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Self-Talk Analysis */}
            <Card>
                <CardHeader>
                    <CardTitle>Positive vs Negative Self-Talk</CardTitle>
                    <CardDescription>Daily breakdown of self-talk patterns</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={selfTalkData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="positive" fill="#82ca9d" name="Positive %" stackId="a" />
                                <Bar dataKey="negative" fill="#8884d8" name="Negative %" stackId="a" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 