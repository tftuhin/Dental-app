"use client";

import { useState } from "react";
import { Building2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ClinicSwitcherProps {
  clinicName: string;
}

export function ClinicSwitcher({ clinicName }: ClinicSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 h-9 px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded bg-sidebar-primary/20">
            <Building2 className="h-3 w-3 text-sidebar-primary" />
          </div>
          <span className="flex-1 truncate text-left text-sm font-medium">
            {clinicName}
          </span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuItem className="font-medium text-primary">
          <Building2 className="mr-2 h-4 w-4" />
          {clinicName}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
