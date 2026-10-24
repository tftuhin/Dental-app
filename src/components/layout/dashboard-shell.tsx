"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { AnimatePresence, motion } from "framer-motion";

interface DashboardShellProps {
  clinicName: string;
  clinicId?: string;
  children: React.ReactNode;
}

export function DashboardShell({
  clinicName,
  clinicId,
  children,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Automatically close mobile sidebar whenever the user navigates to a new page
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile navigation drawer is active
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Persistent Sidebar (hidden on mobile/tablet < lg) */}
      <Sidebar
        clinicName={clinicName}
        clinicId={clinicId}
        className="hidden lg:flex shrink-0"
      />

      {/* Mobile Slide-Over Navigation Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />

            {/* Slide-over panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-sidebar border-r border-sidebar-border shadow-2xl"
            >
              <Sidebar
                clinicName={clinicName}
                clinicId={clinicId}
                isMobile={true}
                onClose={() => setMobileOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Viewport */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <TopBar
          clinicName={clinicName}
          onToggleMobile={() => setMobileOpen((prev) => !prev)}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="min-h-full px-3 py-3 sm:px-5 sm:py-5 md:px-6 md:py-6 max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
