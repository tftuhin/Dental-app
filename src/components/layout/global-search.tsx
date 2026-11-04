"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, User } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { searchPatients } from "@/lib/patients-store";

/** Header patient search (Ctrl/Cmd+K). Searches the patient registry by name, phone or ID. */
export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Local registry lookup: instant, no network round-trip
  const results = useMemo(() => (open ? searchPatients(query, 8) : []), [open, query]);

  const openPatient = (id: string) => {
    setOpen(false);
    setQuery("");
    router.push(`/patients/${id}`);
  };

  return (
    <>
      <Button
        variant="outline"
        className="relative h-8 w-8 p-0 sm:w-44 sm:justify-start sm:px-2.5 md:w-60 text-xs text-muted-foreground shadow-none"
        onClick={() => setOpen(true)}
        aria-label="Search patients"
        title="Search patients (Ctrl+K)"
      >
        <Search className="h-3.5 w-3.5 shrink-0 sm:mr-2" />
        <span className="hidden flex-1 truncate text-left sm:inline-flex">Search patients…</span>
        <kbd className="pointer-events-none ml-auto hidden h-4 select-none items-center rounded border bg-muted px-1 font-mono text-[10px] text-muted-foreground md:inline-flex">
          Ctrl K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Search patients" description="Search by name, phone or patient ID">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Name, phone or patient ID…" value={query} onValueChange={setQuery} />
          <CommandList>
            {query.trim().length < 2 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Type at least 2 characters.</p>
            ) : results.length === 0 ? (
              <CommandEmpty>No patients match &ldquo;{query}&rdquo;.</CommandEmpty>
            ) : (
              <CommandGroup heading="Patients">
                {results.map((p) => (
                  <CommandItem key={p.id} value={p.id} onSelect={() => openPatient(p.id)} className="gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="h-4 px-1 font-mono text-[10px]">
                          {p.customId}
                        </Badge>
                        <span>{p.phone}</span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
