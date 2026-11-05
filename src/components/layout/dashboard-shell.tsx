"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "./app-sidebar";
import { SiteHeader } from "./site-header";
import { OnlineBookingSync } from "./online-booking-sync";

interface DashboardShellProps {
  clinicName: string;
  clinicId?: string;
  /** Used for the public booking page link (/book/<slug>). */
  clinicSlug?: string;
  children: React.ReactNode;
}

/**
 * App shell built on the shadcn Sidebar block: collapsible icon sidebar
 * (Ctrl/Cmd+B toggles it, state remembered in a cookie), off-canvas drawer
 * on mobile, and a sticky slim header.
 */
export function DashboardShell({ clinicName, clinicSlug, children }: DashboardShellProps) {
  return (
    <TooltipProvider delay={0}>
      <OnlineBookingSync />
      <SidebarProvider>
        <AppSidebar clinicName={clinicName} clinicSlug={clinicSlug} />
        <SidebarInset className="min-w-0">
          <SiteHeader clinicName={clinicName} />
          <div className="flex-1 px-4 py-5 md:px-6 md:py-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
