"use client"

import { createClient } from "@/utils/supabase/client"
import { useEffect, useState } from "react"
import { UserNav } from "@/components/user-nav"
import { redirect } from "next/navigation"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function getProfile() {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                redirect("/sign-in")
                return
            }

            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()

            if (error || !profileData || profileData.role !== 'client') {
                redirect("/")
                return
            }
            setProfile(profileData)
            setLoading(false)

        }

        getProfile()
    }, [])

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>
    }

    return (
        <div className=" flex-col md:flex">
            <div className="border-b">
                <div className="flex h-16 items-center px-4">
                    <div className="font-bold text-2xl">Communeed</div>
                    <div className="ml-auto flex items-center space-x-4">
                        {/* <Search /> */}
                        <UserNav user={profile} />
                    </div>
                </div>
            </div>
            {children}
        </div>
    )
} 