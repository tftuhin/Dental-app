"use client"

/**
 * Searchable Select.
 *
 * Same API as the shadcn/Radix Select it replaces (Select, SelectTrigger,
 * SelectValue, SelectContent, SelectItem, …) so every dropdown in the app
 * gets a search box without changing call sites. Built on Radix Popover +
 * cmdk: type to filter, arrow keys to move, Enter to pick, Esc to close.
 */

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { Command as CommandPrimitive } from "cmdk"
import { Check, ChevronDown, Search } from "lucide-react"

import { cn } from "@/lib/utils"

// ─── helpers ──────────────────────────────────────────────────

/** Plain text of a React node, used for searching and for the selected label. */
function nodeText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(nodeText).join(" ")
  if (React.isValidElement(node)) {
    return nodeText((node.props as { children?: React.ReactNode }).children)
  }
  return ""
}

/** Find the children of the <SelectItem> whose value matches, anywhere in the tree. */
function findItemChildren(node: React.ReactNode, value: string): React.ReactNode | undefined {
  let found: React.ReactNode | undefined
  React.Children.forEach(node, (child) => {
    if (found !== undefined || !React.isValidElement(child)) return
    const props = child.props as { value?: unknown; children?: React.ReactNode }
    if (child.type === SelectItem && props.value === value) {
      found = props.children ?? value
      return
    }
    if (props.children) found = findItemChildren(props.children, value)
  })
  return found
}

/**
 * Search rule: every typed word must appear in the item (or its keywords).
 * Items whose text starts with the query rank first, then word-start matches.
 * Stricter than cmdk's default fuzzy match, which lets "napa" match hundreds
 * of unrelated medicines.
 */
function filterItems(value: string, search: string, keywords?: string[]): number {
  const haystack = `${value} ${(keywords || []).join(" ")}`.toLowerCase()
  const words = search.toLowerCase().trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 1
  if (!words.every((w) => haystack.includes(w))) return 0
  const first = words[0]
  if (haystack.startsWith(first)) return 1
  if (new RegExp(`(^|[^a-z0-9])${first.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(haystack)) return 0.8
  return 0.5
}

// ─── context ─────────────────────────────────────────────────

interface SelectContextValue {
  value: string | undefined
  select: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  disabled?: boolean
  selectedLabel: React.ReactNode | undefined
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

function useSelectContext(component: string): SelectContextValue {
  const ctx = React.useContext(SelectContext)
  if (!ctx) throw new Error(`<${component}> must be used inside <Select>`)
  return ctx
}

// ─── Select (root) ───────────────────────────────────────────

interface SelectProps {
  value?: string
  defaultValue?: string
  // Method syntax keeps callers with narrower value types (e.g. union strings) type-compatible
  onValueChange?(value: string): void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?(open: boolean): void
  disabled?: boolean
  name?: string
  required?: boolean
  children?: React.ReactNode
}

function Select({
  value: valueProp,
  defaultValue,
  onValueChange,
  open: openProp,
  defaultOpen,
  onOpenChange,
  disabled,
  name,
  required,
  children,
}: SelectProps) {
  const [innerValue, setInnerValue] = React.useState(defaultValue)
  const [innerOpen, setInnerOpen] = React.useState(defaultOpen ?? false)
  const value = valueProp !== undefined ? valueProp : innerValue
  const open = openProp !== undefined ? openProp : innerOpen

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (openProp === undefined) setInnerOpen(next)
      onOpenChange?.(next)
    },
    [openProp, onOpenChange]
  )

  const select = React.useCallback(
    (next: string) => {
      if (valueProp === undefined) setInnerValue(next)
      onValueChange?.(next)
      setOpen(false)
    },
    [valueProp, onValueChange, setOpen]
  )

  // Label for the trigger, read from the matching <SelectItem> (works while closed)
  const selectedLabel = React.useMemo(
    () => (value ? findItemChildren(children, value) : undefined),
    [children, value]
  )

  return (
    <SelectContext.Provider value={{ value, select, open, setOpen, disabled, selectedLabel }}>
      <PopoverPrimitive.Root open={open} onOpenChange={(o) => !disabled && setOpen(o)} modal>
        {children}
      </PopoverPrimitive.Root>
      {name && <input type="hidden" name={name} value={value ?? ""} required={required} />}
    </SelectContext.Provider>
  )
}

// ─── Trigger & value ─────────────────────────────────────────

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button">
>(({ className, children, ...props }, ref) => {
  const { open, disabled } = useSelectContext("SelectTrigger")
  return (
    <PopoverPrimitive.Trigger asChild disabled={disabled}>
      <button
        ref={ref}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 text-left",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>
    </PopoverPrimitive.Trigger>
  )
})
SelectTrigger.displayName = "SelectTrigger"

function SelectValue({
  placeholder,
  className,
  children,
}: {
  placeholder?: React.ReactNode
  className?: string
  children?: React.ReactNode
}) {
  const { value, selectedLabel } = useSelectContext("SelectValue")
  if (children) return <span className={className}>{children}</span>
  if (value && selectedLabel !== undefined) {
    return <span className={cn("truncate", className)}>{selectedLabel}</span>
  }
  if (value) return <span className={cn("truncate", className)}>{value}</span>
  return <span className={cn("truncate text-muted-foreground", className)}>{placeholder}</span>
}

// ─── Content (search + list) ─────────────────────────────────

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
    /** Accepted for compatibility with the old Radix Select; ignored. */
    position?: "popper" | "item-aligned"
    searchPlaceholder?: string
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- taken out so it isn't passed to the DOM
>(({ className, children, position: _position, searchPlaceholder = "Search…", ...props }, ref) => {
  // Long lists keep max-h-* from className on the scroll area
  const maxH = className?.match(/max-h-\S+/)?.[0]
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align="start"
        sideOffset={4}
        collisionPadding={8}
        className={cn(
          "z-100 w-[max(var(--radix-popover-trigger-width),18rem)] max-w-[min(32rem,calc(100vw-1rem))] overflow-hidden rounded-md border bg-popover p-0 text-popover-foreground shadow-md",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className?.replace(/max-h-\S+/g, "")
        )}
        // Keep keyboard focus in the search box when the list opens
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          const input = (e.currentTarget as HTMLElement | null)?.querySelector("input")
          input?.focus()
        }}
        {...props}
      >
        <CommandPrimitive className="flex flex-col" filter={filterItems}>
          <div className="flex items-center gap-2 border-b px-2.5">
            <Search className="h-3.5 w-3.5 shrink-0 opacity-50" />
            <CommandPrimitive.Input
              placeholder={searchPlaceholder}
              className="flex h-8 w-full bg-transparent py-1.5 text-xs outline-none placeholder:text-muted-foreground"
            />
          </div>
          <CommandPrimitive.List
            className={cn("max-h-72 overflow-y-auto overscroll-contain p-1", maxH)}
          >
            <CommandPrimitive.Empty className="py-4 text-center text-xs text-muted-foreground">
              No matches
            </CommandPrimitive.Empty>
            {children}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  )
})
SelectContent.displayName = "SelectContent"

// ─── Items & structure ───────────────────────────────────────

const SelectItem = React.forwardRef<
  HTMLDivElement,
  {
    value: string
    disabled?: boolean
    className?: string
    children?: React.ReactNode
    /** Extra words to match when searching (e.g. generic name, code). */
    keywords?: string[]
  }
>(({ value, disabled, className, children, keywords }, ref) => {
  const ctx = useSelectContext("SelectItem")
  const text = nodeText(children)
  const isSelected = ctx.value === value
  return (
    <CommandPrimitive.Item
      ref={ref}
      // cmdk filters on this string; include the raw value so items stay unique
      value={`${text} ${value}`}
      keywords={keywords}
      disabled={disabled}
      onSelect={() => ctx.select(value)}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        className
      )}
      aria-selected={isSelected}
    >
      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      {children}
    </CommandPrimitive.Item>
  )
})
SelectItem.displayName = "SelectItem"

function SelectGroup({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <CommandPrimitive.Group className={className}>{children}</CommandPrimitive.Group>
}

function SelectLabel({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div className={cn("px-2 py-1.5 text-sm font-semibold", className)} {...props} />
}

function SelectSeparator({ className }: { className?: string }) {
  return <CommandPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-muted", className)} />
}

/** Kept for API compatibility; the list scrolls natively. */
function SelectScrollUpButton() {
  return null
}
function SelectScrollDownButton() {
  return null
}

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
