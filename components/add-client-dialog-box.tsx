"use client"

import * as React from "react"
import { X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"
import { useState, FormEventHandler } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AddClientDialogProps {
    trigger?: React.ReactNode
}

export function AddClientDialog({ trigger }: AddClientDialogProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [firstName, setFirstName] = React.useState("");
    const [lastName, setLastName] = React.useState("");
    const [pronouns, setPronouns] = React.useState("");
    const [email, setEmail] = React.useState("");

    const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        const email = formData.get('email') as string;
        const fullName = formData.get('fullName') as string;
        const phone = formData.get('phone') as string;

        // First create a profile
        const { data: profile } = await supabase
            .from('profiles')
            .insert({
                id: '3a1dfa40-20e6-45f9-a5a7-cc46d7038e92',
                email,
                full_name: fullName,
                role: 'client'
            })
            .select()
            .single();

        if (profile) {
            // Then create the client record
            await supabase
                .from('clients')
                .insert({
                    profile_id: profile.id,
                    therapist_id: (await supabase.auth.getUser()).data.user?.id,
                    phone_number: phone,
                    status: 'active'
                });

            setIsOpen(false);
            router.refresh();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="default">
                        <Plus className="mr-2 h-4 w-4" /> Add Client
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>Add Client</DialogTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-md"
                            onClick={() => setIsOpen(false)}
                        >
                            {/* <X className="h-4 w-4" /> */}
                        </Button>
                    </div>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-4">
                        <div>
                            <Input
                                required
                                placeholder="First Name *"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <Input
                                required
                                placeholder="Last Name *"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <Input
                                required
                                type="email"
                                placeholder="Email *"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <Select value={pronouns} onValueChange={setPronouns}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pronouns" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="he/him">he/him</SelectItem>
                                    <SelectItem value="she/her">she/her</SelectItem>
                                    <SelectItem value="they/them">they/them</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={!firstName || !lastName || !email}
                    >
                        Add Client
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}

