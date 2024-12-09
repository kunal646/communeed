"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import { notFound } from 'next/navigation'

interface ClientContextType {
    client: any
    loading: boolean
    setClient: (client: any) => void
}

const ClientContext = createContext<ClientContextType | undefined>(undefined)

export function ClientProvider({ children }: { children: ReactNode }) {
    const { id } = useParams()
    const [client, setClient] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchClient() {
            try {
                const { data: clientData } = await supabase
                    .from('clients')
                    .select(`
            *,
            profile:profiles!clients_profile_id_fkey(*)
          `)
                    .eq('id', id)
                    .single()

                if (!clientData) {
                    notFound()
                }

                setClient(clientData)
            } catch (error) {
                console.error('Error fetching client:', error)
                notFound()
            } finally {
                setLoading(false)
            }
        }

        fetchClient()
    }, [id])

    return (
        <ClientContext.Provider value={{ client, loading, setClient }}>
            {children}
        </ClientContext.Provider>
    )
}

export function useClient() {
    const context = useContext(ClientContext)
    if (context === undefined) {
        throw new Error('useClient must be used within a ClientProvider')
    }
    return context
} 