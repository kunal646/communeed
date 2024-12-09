import Link from "next/link"

import { cn } from "@/lib/utils"

export function MainNav({
    className,
    ...props
}: React.HTMLAttributes<HTMLElement>) {
    return (
        <nav
            className={cn("flex items-center space-x-4 lg:space-x-6", className)}
            {...props}
        >
            <Link
                href="/therapist/dashboard"
                className="text-sm font-medium transition-colors hover:text-primary"
            >
                Overview
            </Link>
            <Link
                href="/therapist/dashboard/sessions"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
                Sessions
            </Link>
            <Link
                href="/therapist/dashboard/clients"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
                Clients
            </Link>
            {/* <Link
                href="/therapist/dashboard/reports"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
                Reports
            </Link> */}
        </nav>
    )
} 