"use client";

import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

interface SessionsClientProps {
    initialData: {
        sessionData: any[];
        therapistName: string;
    } | null;
}
function formatSessions(sessionData: any[]) {
    // Group sessions by day
    const sessionsByDay = sessionData.reduce(
        (acc: Record<string, any[]>, session: any) => {
            const date = new Date(session.session_date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
            });

            if (!acc[date]) {
                acc[date] = [];
            }

            acc[date].push({
                id: session.id,
                clientName: session.client?.profile?.full_name,
                therapist: session.therapist?.full_name,
                time: new Date(session.session_date).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                }),
                duration: session.recording_time ? `${session.recording_time} min` : null,
            });

            return acc;
        },
        {}
    );

    return Object.entries(sessionsByDay).map(([date, sessions]) => ({
        date,
        sessions,
    }));
}
export default function SessionsClient({ initialData }: SessionsClientProps) {
    const [sessions, setSessions] = useState(() =>
        initialData?.sessionData ? formatSessions(initialData.sessionData) : []
    );
    const router = useRouter();


    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">Sessions</h2>

                <Select defaultValue={initialData?.therapistName || "hi"}>
                    <SelectTrigger className="w-full max-w-xs">
                        <SelectValue placeholder="Select therapist" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={initialData?.therapistName || "hi"}>{initialData?.therapistName || ""}</SelectItem>
                    </SelectContent>
                </Select>

                {sessions.map((day, dayIndex) => (
                    <div key={dayIndex} className="space-y-4">
                        <h3 className="text-lg font-semibold">{day.date}</h3>
                        <div className="space-y-2">
                            {day.sessions.map((session, sessionIndex) => (
                                <div
                                    key={sessionIndex}
                                    className="flex items-center gap-4 p-4 bg-white rounded-lg border hover:bg-gray-50 cursor-pointer"
                                    onClick={() => router.push(`/therapist/dashboard/sessions/${session.id}`)}
                                >
                                    <FileText className="h-5 w-5 text-gray-400" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-medium text-gray-900">
                                                {session.clientName}
                                            </h4>
                                            {session.time && (
                                                <>
                                                    <span className="text-gray-400">•</span>
                                                    <span className="text-sm text-gray-500">{session.time}</span>
                                                </>
                                            )}
                                            {session.duration && (
                                                <>
                                                    <span className="text-gray-400">•</span>
                                                    <span className="text-sm text-gray-500">{session.duration}</span>
                                                </>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">
                                            {session.therapist}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
