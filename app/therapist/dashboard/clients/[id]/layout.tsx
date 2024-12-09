"use client"

import { ClientProvider } from "@/contexts/client-context"

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <ClientProvider>{children}</ClientProvider>
} 