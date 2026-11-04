"use client";

import Link from "next/link";
import { useClinicName } from "@/hooks/use-clinic-name";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Stethoscope,
  Pill,
  Receipt,
  Users,
  FlaskConical,
  Award,
  MessageSquare,
  BarChart3,
  Settings,
  Globe,
} from "lucide-react";
import { ToothIcon } from "@/components/icons/dental-icons";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

type NavItem = { title: string; href: string; icon: React.ComponentType<{ className?: string }> };

// Grouped in the order a patient moves through the clinic
const NAV: Array<{ label?: string; items: NavItem[] }> = [
  { items: [{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard }] },
  {
    label: "Patient visit",
    items: [
      { title: "Appointments", href: "/appointments", icon: CalendarDays },
      { title: "Procedures", href: "/procedures", icon: Stethoscope },
      { title: "Prescriptions", href: "/prescriptions", icon: Pill },
      { title: "Billing", href: "/billing", icon: Receipt },
    ],
  },
  {
    label: "Records",
    items: [
      { title: "Patients", href: "/patients", icon: Users },
      { title: "Lab Orders", href: "/lab-orders", icon: FlaskConical },
      { title: "Certificates", href: "/certificates", icon: Award },
    ],
  },
  {
    label: "Clinic",
    items: [
      { title: "SMS & Campaigns", href: "/sms", icon: MessageSquare },
      { title: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
];

export function AppSidebar({ clinicName: serverClinicName }: { clinicName: string }) {
  const pathname = usePathname();
  const clinicName = useClinicName(serverClinicName);
  const { isMobile, setOpenMobile } = useSidebar();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  // Close the mobile drawer after navigating
  const onNavigate = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={clinicName}
              render={<Link href="/dashboard" onClick={onNavigate} />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <ToothIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">DentalOS1</span>
                <span className="truncate text-xs text-muted-foreground">{clinicName}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV.map((group, gi) => (
          <SidebarGroup key={group.label || gi}>
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive(item.href)}
                      tooltip={item.title}
                      render={<Link href={item.href} onClick={onNavigate} />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Public booking page"
              render={<Link href="/book/dhaka-dental" target="_blank" rel="noopener" />}
            >
              <Globe />
              <span>Public Booking</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isActive("/settings")}
              tooltip="Settings"
              render={<Link href="/settings" onClick={onNavigate} />}
            >
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
