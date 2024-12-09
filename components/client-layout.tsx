"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useClient } from "@/contexts/client-context"
import { supabase } from "@/lib/supabase"

interface ClientLayoutProps {
    children: React.ReactNode
}

const navigation = [
    { name: "Client", href: "/therapist/dashboard/clients/[id]" },
    { name: "Sessions", href: "/therapist/dashboard/clients/[id]/sessions" },
    { name: "Assessments", href: "/therapist/dashboard/clients/[id]/assessments" },
    { name: "Daily Logs", href: "/therapist/dashboard/clients/[id]/daily-logs" },
    { name: "Analytics", href: "/therapist/dashboard/clients/[id]/analytics" },
    // { name: "Treatment Plan", href: "/therapist/dashboard/clients/[id]/treatment-plan" },
    // { name: "Interventions", href: "/therapist/dashboard/clients/[id]/interventions" },
    // { name: "Worksheets", href: "/therapist/dashboard/clients/[id]/worksheets" },
]

export function ClientLayout({ children }: ClientLayoutProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [isHighRisk, setIsHighRisk] = useState(false)
    const { client, loading, setClient } = useClient()

    useEffect(() => {
        if (client) {
            setIsHighRisk(client.is_high_risk || false)
        }
    }, [client])

    if (loading) {
        return <div>Loading...</div>
    }

    if (!client) {
        return null
    }

    const handleHighRiskToggle = async () => {
        try {
            const newHighRiskValue = !isHighRisk
            const { error } = await supabase
                .from('clients')
                .update({ is_high_risk: newHighRiskValue })
                .eq('id', client.id)

            if (error) throw error

            setIsHighRisk(newHighRiskValue)
            setClient({ ...client, is_high_risk: newHighRiskValue })
        } catch (error) {
            console.error('Error updating high risk status:', error)
        }
    }
    // TODO: add this in next release
    // const handleTreatmentComplete = async () => {
    //     try {
    //         const { error } = await supabase
    //             .from('clients')
    //             .update({
    //                 status: 'completed',
    //             })
    //             .eq('id', client.id)

    //         if (error) throw error

    //         router.refresh()
    //     } catch (error) {
    //         console.error('Error completing treatment:', error)
    //     }
    // }

    const handleArchiveClient = async () => {
        try {
            const { error } = await supabase
                .from('clients')
                .update({
                    status: 'archived',
                })
                .eq('id', client.id)

            if (error) throw error

            router.refresh()
        } catch (error) {
            console.error('Error archiving client:', error)
        }
    }

    const handleUnarchiveClient = async () => {
        try {
            const { error } = await supabase
                .from('clients')
                .update({
                    status: 'active',
                })
                .eq('id', client.id)

            if (error) throw error

            router.refresh()
        } catch (error) {
            console.error('Error unarchiving client:', error)
        }
    }

    return (
        <div className="flex min-h-screen flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold">{client.profile.full_name}</h1>
                        <Button
                            variant="ghost"
                            className={cn(
                                "rounded-md px-2 text-xs font-semibold",
                                "hover:bg-destructive/10",
                                isHighRisk ? "bg-destructive/10 text-destructive" : "text-muted-foreground"
                            )}
                            onClick={handleHighRiskToggle}
                        >
                            {isHighRisk ? "High-Risk" : "Add High-Risk"}
                        </Button>
                        <Badge variant="default" className={cn(
                            "rounded-md",
                            client.status === 'active' ? "bg-green-100 text-green-800" :
                                client.status === 'archived' ? "bg-gray-100 text-gray-800" :
                                    "bg-yellow-100 text-yellow-800"
                        )}>
                            {client.status === 'active' ? 'In Treatment' :
                                client.status === 'archived' ? 'Archived' : 'Unknown'}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">Actions</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {client.status === 'archived' ? (
                                    <DropdownMenuItem onClick={handleUnarchiveClient}>
                                        Unarchive Client
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem onClick={handleArchiveClient}>
                                        Archive Client
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {/* will launch this is next release */}
                        {/* <Button>New Session</Button> */}
                    </div>
                </div>
                <nav className="flex border-b">
                    {navigation.map((item) => {
                        const isActive = pathname.includes(item.href.split("/").pop()!)
                        return (
                            <Link
                                key={item.name}
                                href={item.href.replace("[id]", client.id)}
                                className={cn(
                                    "px-4 py-2 text-sm font-medium transition-colors hover:text-primary",
                                    isActive
                                        ? "border-b-2 border-primary text-primary"
                                        : "text-muted-foreground"
                                )}
                            >
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>
                <div>{children}</div>
            </div>
        </div>
    )
}
