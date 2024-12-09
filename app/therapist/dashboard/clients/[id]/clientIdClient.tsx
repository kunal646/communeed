"use client"

import { ClientLayout } from "@/components/client-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useClient } from "@/contexts/client-context"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { ClientWithProfile } from "@/types/database"

interface ClientPageClientProps {
    initialData: ClientWithProfile | null
}

export default function ClientPageClient({ initialData }: ClientPageClientProps) {
    const [client, setClient] = useState(initialData)

    const [formData, setFormData] = useState({
        firstName: client?.profile.full_name.split(' ')[0] || '',
        lastName: client?.profile.full_name.split(' ').slice(1).join(' ') || '',
        pronouns: client?.pronouns || '',
        email: client?.profile.email || '',
        phone: client?.phone_number || ''
    })


    if (!client) {
        return null
    }

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            // Update profile table
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: `${formData.firstName} ${formData.lastName}`,

                })
                .eq('id', client.profile.id)

            if (profileError) throw profileError

            // Update clients table
            const { error: clientError } = await supabase
                .from('clients')
                .update({
                    phone_number: formData.phone,
                    pronouns: formData.pronouns
                })
                .eq('id', client.id)

            if (clientError) throw clientError

            setClient({ ...client, phone_number: formData.phone, pronouns: formData.pronouns, profile: { ...client.profile, full_name: `${formData.firstName} ${formData.lastName}` } })

            alert('Changes saved successfully!')
        } catch (error) {
            console.error('Error updating client:', error)
            alert('Failed to save changes')
        }
    }

    return (
        <ClientLayout>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Client</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input
                                        id="firstName"
                                        value={formData.firstName}
                                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        value={formData.lastName}
                                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pronouns">Pronouns</Label>
                                    <Select
                                        value={formData.pronouns}
                                        onValueChange={(value) => handleInputChange('pronouns', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select pronouns" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="he/him">he/him</SelectItem>
                                            <SelectItem value="she/her">she/her</SelectItem>
                                            <SelectItem value="they/them">they/them</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="text-sm text-muted-foreground">
                                        {formData.email}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Cell Phone</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button type="submit">Save</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </ClientLayout>
    )
}
