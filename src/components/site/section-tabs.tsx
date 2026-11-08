"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Sticky "on this page" tabs: highlights the section in view, scrolls to a
 * section on click, and keeps the active tab visible when the row scrolls
 * sideways on small screens.
 */
export function SectionTabs({ items }: { items: Array<{ id: string; label: string }> }) {
  const [active, setActive] = useState(items[0]?.id || "");
  const rowRef = useRef<HTMLDivElement>(null);

  // The section nearest the top of the screen (below the sticky bars) is the active one
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-140px 0px -55% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  // Keep the active tab in view in the scrolling row
  useEffect(() => {
    const row = rowRef.current;
    const tab = row?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    if (!row || !tab) return;
    const left = tab.offsetLeft - row.clientWidth / 2 + tab.clientWidth / 2;
    row.scrollTo({ left, behavior: "smooth" });
  }, [active]);

  return (
    <nav aria-label="On this page" className="sticky top-16 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl lg:top-[72px]">
      <div className="relative mx-auto max-w-7xl">
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent lg:hidden" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent lg:hidden" />
        <div
          ref={rowRef}
          className="flex gap-1.5 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] sm:px-6 lg:justify-center [&::-webkit-scrollbar]:hidden"
        >
          {items.map((i) => (
            <a
              key={i.id}
              href={`#${i.id}`}
              data-tab={i.id}
              aria-current={active === i.id ? "true" : undefined}
              onClick={() => setActive(i.id)}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                active === i.id ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:bg-teal-50 hover:text-teal-800"
              }`}
            >
              {i.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
