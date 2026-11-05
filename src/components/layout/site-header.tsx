"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Calendar, UserPlus, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlobalSearch } from "./global-search";
import { UserNav } from "./user-nav";
import { NotificationBell } from "./notification-bell";
import { useClinicName } from "@/hooks/use-clinic-name";

const TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  appointments: "Appointments",
  procedures: "Examination & Procedure",
  prescriptions: "Prescriptions",
  billing: "Billing",
  patients: "Patients",
  "lab-orders": "Lab Orders",
  certificates: "Certificates",
  sms: "SMS & Campaigns",
  analytics: "Analytics",
  settings: "Settings",
};

/** Slim page header: sidebar toggle, current section, search, quick actions, user menu. */
export function SiteHeader({ clinicName: serverClinicName }: { clinicName: string }) {
  const pathname = usePathname();
  const clinicName = useClinicName(serverClinicName);
  const section = pathname.split("/").filter(Boolean)[0] || "dashboard";
  const title = TITLES[section] || section.charAt(0).toUpperCase() + section.slice(1);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mx-1 h-4 data-vertical:self-center" />
      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm md:flex">
        <span className="truncate text-muted-foreground max-w-48">{clinicName}</span>
        <span className="text-muted-foreground/50">/</span>
        <span className="truncate font-medium">{title}</span>
      </nav>
      <span className="truncate text-sm font-medium md:hidden">{title}</span>

      <div className="ml-auto flex items-center gap-2">
        <GlobalSearch />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-8 gap-1.5">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Create</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/appointments?new=true" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Book appointment
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/patients/new" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Register patient
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/appointments?session=active" className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Start next session
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <NotificationBell />
        <UserNav />
      </div>
    </header>
  );
}
