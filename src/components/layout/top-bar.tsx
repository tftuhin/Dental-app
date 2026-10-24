"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Bell, Calendar, UserPlus, Stethoscope, Sparkles } from "lucide-react";
import { ToothIcon } from "@/components/icons/dental-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlobalSearch } from "./global-search";
import { UserNav } from "./user-nav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopBarProps {
  clinicName: string;
}

export function TopBar({ clinicName }: TopBarProps) {
  const pathname = usePathname();

  // Generate breadcrumb from pathname
  const segments = pathname.split("/").filter(Boolean);
  const currentTitle = segments[0]
    ? segments[0] === "clinical"
      ? "Clinical Briefing"
      : segments[0].charAt(0).toUpperCase() + segments[0].slice(1).replace("-", " ")
    : "Dashboard";

  return (
    <header className="flex h-16 w-full items-center justify-between border-b bg-card/60 px-6 backdrop-blur-md">
      {/* Left: Top Logo, Application Name & Breadcrumbs */}
      <div className="flex items-center gap-3.5">
        {/* Application Top Logo & Name */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 rounded-lg py-1 px-1.5 -ml-1.5 transition-all hover:bg-muted/60 group"
          title="DentalOS1 Clinical Platform"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm group-hover:scale-105 transition-transform">
            <ToothIcon className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold tracking-tight text-foreground">
              DentalOS1
            </span>
            <Badge
              variant="outline"
              className="hidden sm:inline-flex h-4 px-1 text-[9px] font-semibold text-primary border-primary/30 bg-primary/5 uppercase"
            >
              Pro
            </Badge>
          </div>
        </Link>

        {/* Subtle Separator */}
        <span className="h-4 w-[1px] bg-border/80 hidden sm:inline-block" />

        {/* Clinic & Page Breadcrumbs */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground truncate max-w-[120px] sm:max-w-[200px]">
              {clinicName}
            </span>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              {currentTitle}
            </span>
          </div>
        </div>
      </div>

      {/* Middle: Global Cmd+K Search */}
      <div className="flex items-center gap-4">
        <GlobalSearch />
      </div>

      {/* Right: Quick Actions, Notifications & User */}
      <div className="flex items-center gap-3">
        {/* Quick Add Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Quick Action</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs font-semibold uppercase text-muted-foreground">
              New Record
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/patients/new" className="flex items-center gap-2 cursor-pointer">
                <UserPlus className="h-4 w-4 text-emerald-600" />
                <span>Register Patient</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/appointments?new=true" className="flex items-center gap-2 cursor-pointer">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span>Book Appointment</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/clinical/new" className="flex items-center gap-2 cursor-pointer">
                <Stethoscope className="h-4 w-4 text-teal-600" />
                <span>Start Encounter</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
        </Button>

        {/* User Nav */}
        <UserNav />
      </div>
    </header>
  );
}
