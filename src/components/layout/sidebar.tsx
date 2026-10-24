"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  Receipt,
  Stethoscope,
  Pill,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  ClipboardList,
  Award,
  BarChart3,
  FlaskConical,
  Globe,
  Menu,
  X,
} from "lucide-react";
import { ToothIcon } from "@/components/icons/dental-icons";
import { cn } from "@/lib/utils";
import { UserNav } from "./user-nav";
import { ClinicSwitcher } from "./clinic-switcher";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview & daily summary",
  },
  {
    title: "Appointments",
    href: "/appointments",
    icon: CalendarDays,
    description: "Schedule, session & clinical briefing",
  },
  {
    title: "Prescriptions",
    href: "/prescriptions",
    icon: Pill,
    description: "e-Prescription studio",
  },
  {
    title: "Lab Orders",
    href: "/lab-orders",
    icon: FlaskConical,
    description: "Dental lab tracking",
  },
  {
    title: "Billing",
    href: "/billing",
    icon: Receipt,
    description: "Invoices & payments",
  },
  {
    title: "Patients",
    href: "/patients",
    icon: Users,
    description: "Patient directory & profiles",
  },
  {
    title: "Certificates",
    href: "/certificates",
    icon: Award,
    description: "Medical certificates",
  },
  {
    title: "SMS & Campaigns",
    href: "/sms",
    icon: MessageSquare,
    description: "Automated patient messaging",
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Reports & insights",
  },
];

const bottomNavItems = [
  {
    title: "Public Booking",
    href: "/clinic-settings/booking",
    icon: Globe,
    description: "Online booking page",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Clinic & system settings",
  },
];

interface SidebarProps {
  clinicName?: string;
  clinicId?: string;
  className?: string;
  isMobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  clinicName,
  clinicId,
  className,
  isMobile = false,
  onClose,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const effectiveCollapsed = isMobile ? false : collapsed;

  const asideContent = (
    <>
      {/* Header */}
      <div className="flex h-14 sm:h-16 items-center justify-between border-b border-sidebar-border px-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary shadow-sm shrink-0">
            <ToothIcon className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          {!effectiveCollapsed && (
            <div>
              <p className="text-sm font-bold leading-none text-sidebar-primary-foreground tracking-tight">
                DentalOS1
              </p>
              <p className="text-[10px] leading-tight text-sidebar-foreground/60">
                Clinical Platform
              </p>
            </div>
          )}
        </div>

        {isMobile ? (
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            title="Close Menu"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Clinic Switcher */}
      {!effectiveCollapsed && (
        <div className="border-b border-sidebar-border p-2">
          <ClinicSwitcher clinicName={clinicName || "My Clinic"} />
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href} onClick={isMobile ? onClose : undefined}>
              <div
                className={cn(
                  "sidebar-nav-item group",
                  isActive && "active"
                )}
                title={effectiveCollapsed ? item.title : undefined}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!effectiveCollapsed && (
                  <span className="truncate">{item.title}</span>
                )}
                {isActive && (
                  <div
                    className="absolute right-1 h-5 w-1 rounded-full bg-sidebar-primary-foreground/40"
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Nav */}
      <div className="border-t border-sidebar-border p-2 space-y-0.5">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} onClick={isMobile ? onClose : undefined}>
              <div
                className={cn(
                  "sidebar-nav-item",
                  isActive && "active"
                )}
                title={effectiveCollapsed ? item.title : undefined}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!effectiveCollapsed && (
                  <span className="truncate text-sm">{item.title}</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <aside className={cn("relative flex h-full w-full flex-col overflow-hidden bg-sidebar", className)}>
        {asideContent}
      </aside>
    );
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className={cn("relative flex h-full flex-col overflow-hidden border-r border-sidebar-border bg-sidebar", className)}
    >
      {asideContent}
    </motion.aside>
  );
}
