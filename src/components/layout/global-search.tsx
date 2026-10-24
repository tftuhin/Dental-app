"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, User, Calendar } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";

interface SearchResult {
  id: string;
  name: string;
  customPatientId?: string;
  phone?: string;
  type: "patient";
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = useCallback(async (value: string) => {
    setQuery(value);
    if (value.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/patients/search?q=${encodeURIComponent(value)}&limit=8`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.patients || []);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelect = (patient: SearchResult) => {
    setOpen(false);
    router.push(`/patients/${patient.id}`);
  };

  return (
    <>
      <Button
        variant="outline"
        className="relative h-8 w-8 sm:w-44 md:w-60 p-0 sm:px-2.5 sm:justify-start rounded-lg bg-background/50 text-xs text-muted-foreground shadow-none"
        onClick={() => setOpen(true)}
        id="global-search-trigger"
        title="Search patients (⌘K)"
      >
        <Search className="h-3.5 w-3.5 sm:mr-2 shrink-0" />
        <span className="hidden sm:inline-flex flex-1 text-left truncate">Search patients…</span>
        <kbd className="pointer-events-none ml-auto hidden md:inline-flex h-4 select-none items-center gap-0.5 rounded border bg-muted px-1 font-mono text-[9px] font-medium text-muted-foreground">
          <span className="text-[10px]">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search by name, phone, or patient ID…"
          value={query}
          onValueChange={handleSearch}
        />
        <CommandList>
          {loading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Searching…
            </div>
          ) : results.length === 0 && query.length >= 2 ? (
            <CommandEmpty>No patients found for "{query}"</CommandEmpty>
          ) : (
            <CommandGroup heading="Patients">
              {results.map((patient) => (
                <CommandItem
                  key={patient.id}
                  value={patient.id}
                  onSelect={() => handleSelect(patient)}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{patient.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {patient.customPatientId && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1">
                          {patient.customPatientId}
                        </Badge>
                      )}
                      {patient.phone && (
                        <span className="text-[11px] text-muted-foreground">
                          {patient.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
