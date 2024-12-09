"use client"

import { use, useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { Plus, Trash2 } from "lucide-react"
import { ClientLayout } from "@/components/client-layout"
import { Label } from "@/components/ui/label"
interface Goal {
    id: number
    goal: string
    target: number
    target_duration: 'daily' | 'weekly'
}

interface CopingMechanism {
    id: number
    mechanism: string
}

export default function AssessmentsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const supabase = createClient()

    const [goals, setGoals] = useState<Goal[]>([])
    const [mechanisms, setMechanisms] = useState<CopingMechanism[]>([])
    const [newGoal, setNewGoal] = useState({ goal: '', target: '', duration: 'daily' })
    const [newMechanism, setNewMechanism] = useState('')

    // Fetch goals and mechanisms
    useEffect(() => {
        async function fetchData() {
            const [goalsResponse, mechanismsResponse] = await Promise.all([
                supabase
                    .from('goals')
                    .select('*')
                    .eq('client_id', resolvedParams.id)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('coping_mechanisms')
                    .select('*')
                    .eq('client_id', resolvedParams.id)
                    .order('created_at', { ascending: false })
            ])

            if (goalsResponse.error) console.error('Error fetching goals:', goalsResponse.error)
            if (mechanismsResponse.error) console.error('Error fetching mechanisms:', mechanismsResponse.error)

            setGoals(goalsResponse.data || [])
            setMechanisms(mechanismsResponse.data || [])
        }

        fetchData()
    }, [resolvedParams.id])

    // Add new goal
    const handleAddGoal = async () => {
        if (!newGoal.goal.trim() || !newGoal.target) return

        const { data, error } = await supabase
            .from('goals')
            .insert({
                client_id: resolvedParams.id,
                goal: newGoal.goal,
                target: parseFloat(newGoal.target),
                target_duration: newGoal.duration
            })
            .select()
            .single()

        if (error) {
            console.error('Error adding goal:', error)
            return
        }

        setGoals([data, ...goals])
        setNewGoal({ goal: '', target: '', duration: 'daily' })
    }

    // Add new coping mechanism
    const handleAddMechanism = async () => {
        if (!newMechanism.trim()) return

        const { data, error } = await supabase
            .from('coping_mechanisms')
            .insert({
                client_id: resolvedParams.id,
                mechanism: newMechanism
            })
            .select()
            .single()

        if (error) {
            console.error('Error adding mechanism:', error)
            return
        }

        setMechanisms([data, ...mechanisms])
        setNewMechanism('')
    }

    // Delete goal
    const handleDeleteGoal = async (id: number) => {
        const { error } = await supabase
            .from('goals')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting goal:', error)
            return
        }

        setGoals(goals.filter(goal => goal.id !== id))
    }

    // Delete coping mechanism
    const handleDeleteMechanism = async (id: number) => {
        const { error } = await supabase
            .from('coping_mechanisms')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting mechanism:', error)
            return
        }

        setMechanisms(mechanisms.filter(mechanism => mechanism.id !== id))
    }

    return (
        <ClientLayout>
            <div className="space-y-8">
                {/* Goals Section */}
                <div className="space-y-6">
                    {/* Goals Section */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-start gap-4">
                            <div>
                                <CardTitle>Treatment Goals</CardTitle>
                                <CardDescription>Set and track client&apos;s treatment goals</CardDescription>
                            </div>
                            <Button onClick={handleAddGoal}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Goal
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex-grow">
                                            <Textarea
                                                placeholder="Enter goal (e.g., reduce binge watching)"
                                                value={newGoal.goal}
                                                onChange={(e) => setNewGoal({ ...newGoal, goal: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                placeholder="Times"
                                                value={newGoal.target}
                                                onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                                                className="w-24"
                                            />
                                            <Select
                                                value={newGoal.duration}
                                                onValueChange={(value) => setNewGoal({ ...newGoal, duration: value as 'daily' | 'weekly' })}
                                            >
                                                <SelectTrigger className="w-32">
                                                    <SelectValue placeholder="Per" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="daily">Day</SelectItem>
                                                    <SelectItem value="weekly">Week</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">Assigned Goals</h3>
                                    {goals.map((goal) => (
                                        <div key={goal.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                            <div className="space-y-1">
                                                <p className="font-medium">{goal.goal}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {goal.target} times per {goal.target_duration === 'daily' ? 'day' : 'week'}
                                                </p>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteGoal(goal.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Coping Mechanisms Section */}
                    <Card>
                        <CardHeader className="flex flex-row items-center  justify-start gap-4">
                            <div>
                                <CardTitle>Coping Mechanisms</CardTitle>
                                <CardDescription>Assign coping mechanisms for the client</CardDescription>
                            </div>
                            <Button onClick={handleAddMechanism} >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Mechanism
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                {/* Left Column - Add New */}
                                <div className="space-y-4 ">
                                    <div className="flex flex-col gap-4">
                                        <Input
                                            placeholder="Enter new coping mechanism"
                                            value={newMechanism}
                                            onChange={(e) => setNewMechanism(e.target.value)}
                                            className="flex-grow"
                                        />
                                    </div>
                                </div>

                                {/* Right Column - List */}
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">Assigned Mechanisms</h3>
                                    {mechanisms.map((mechanism) => (
                                        <div key={mechanism.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                            <p className="font-medium">{mechanism.mechanism}</p>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteMechanism(mechanism.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </ClientLayout>
    )
} 