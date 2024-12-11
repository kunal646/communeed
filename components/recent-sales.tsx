"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow, format } from "date-fns"

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

export function RecentSales({ sessions }: { sessions: Session[] }) {


    return (
        <div className="space-y-8">
            {sessions.slice(0, 5).map((session) => (
                <div key={session.id} className="flex items-center">
                    <Avatar className="h-9 w-9">
                        <AvatarFallback>
                            {session.client.profile.full_name
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">
                            {session.client.profile.full_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {format(new Date(session.session_date), 'PPp')}
                        </p>
                    </div>
                    <div className="ml-auto font-medium">
                        {session.recording_time} min
                    </div>
                </div>
            ))}
        </div>
    )
} 