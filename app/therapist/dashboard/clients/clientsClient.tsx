"use client"


import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Plus, ChevronRight } from "lucide-react";
import { AddClientDialog } from "@/components/add-client-dialog-box";
import { createClient } from "@/utils/supabase/client";
import { ClientWithProfile } from "@/types/database";
import { useRouter } from "next/navigation";

interface ClientsClientProps {
    initialData: {
        therapistName: string;
        clients: ClientWithProfile[];
    } | null;
}



export default function ClientsClient({ initialData }: ClientsClientProps) {
    const [clients, setClients] = useState<ClientWithProfile[] | null>(initialData?.clients || null);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<string>("all");
    const [therapistName, setTherapistName] = useState<string | null>(initialData?.therapistName || null);
    const router = useRouter()

    const filterClients = (status: string, clients: ClientWithProfile[] | null) => {
        if (!clients) return [];
        if (status === "all") return clients;
        return clients.filter((client) => client.status === status);
    };

    const filteredClients = filterClients(tab, clients);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
                </div>
                <div className="flex items-center space-x-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto">
                                {therapistName}
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem> {therapistName}</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {/* Will launch this in the next release */}
                    {/* <AddClientDialog /> */}
                </div>
            </div>
            <Tabs defaultValue="all" className="space-y-4" onValueChange={(value) => setTab(value)}>
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="archived">Archived</TabsTrigger>
                </TabsList>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">FIRST NAME</TableHead>
                                <TableHead className="w-[200px]">LAST NAME</TableHead>
                                <TableHead className="w-[300px]">EMAIL</TableHead>
                                <TableHead className="w-[200px]">PHONE</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClients.map((client) => {
                                const [firstName, ...lastNameParts] = client.profile.full_name.split(" ");
                                const lastName = lastNameParts.join(" ");

                                return (
                                    <TableRow
                                        onClick={() => router.push(`/therapist/dashboard/clients/${client.id}`)}
                                        key={client.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                    >
                                        <TableCell className="font-medium">{firstName}</TableCell>
                                        <TableCell>{lastName}</TableCell>
                                        <TableCell>{client.profile.email}</TableCell>
                                        <TableCell>{client.phone_number || "-"}</TableCell>
                                        <TableCell>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </Tabs>
        </div>
    );
}
