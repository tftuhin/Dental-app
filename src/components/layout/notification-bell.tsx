"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, Info, AlertTriangle, XCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AppNotification,
  NotificationKind,
  clearNotifications,
  getNotifications,
  installToastRecorder,
  markAllNotificationsRead,
  removeNotification,
  subscribeNotifications,
} from "@/lib/notifications-store";

// Start recording toasts as soon as the app shell loads
installToastRecorder();

const EMPTY: AppNotification[] = [];

const ICONS: Record<NotificationKind, { icon: typeof Bell; className: string }> = {
  success: { icon: CheckCircle2, className: "text-emerald-600" },
  info: { icon: Info, className: "text-sky-600" },
  warning: { icon: AlertTriangle, className: "text-amber-600" },
  error: { icon: XCircle, className: "text-red-600" },
};

function timeAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(ts).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** Bell in the header: every notification, newest first, with an unread count. */
export function NotificationBell() {
  const router = useRouter();
  const list = useSyncExternalStore(subscribeNotifications, getNotifications, () => EMPTY);
  const [open, setOpen] = useState(false);
  // Unread when the menu was opened, so they stay highlighted while it's open
  const [highlight, setHighlight] = useState<Set<string>>(new Set());
  const unread = list.filter((n) => !n.read).length;

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setHighlight(new Set(list.filter((n) => !n.read).map((n) => n.id)));
      markAllNotificationsRead();
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-1.5rem))] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          {list.length > 0 && (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => clearNotifications()}
            >
              Clear all
            </button>
          )}
        </div>

        {list.length === 0 ? (
          <p className="px-3 py-8 text-center text-xs text-muted-foreground">No notifications yet.</p>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto py-1">
            {list.map((n) => {
              const { icon: Icon, className } = ICONS[n.kind] || ICONS.info;
              return (
                <DropdownMenuItem
                  key={n.id}
                  className={`group items-start gap-2.5 rounded-none px-3 py-2 ${highlight.has(n.id) ? "bg-primary/5" : ""}`}
                  onSelect={() => {
                    if (n.href) router.push(n.href);
                  }}
                >
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${className}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium leading-snug">{n.title}</p>
                    {n.description && (
                      <p className="mt-0.5 line-clamp-3 whitespace-pre-line text-[11px] text-muted-foreground">
                        {n.description}
                      </p>
                    )}
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {timeAgo(n.createdAt)}
                      {n.href ? " · Open" : ""}
                    </p>
                  </div>
                  {highlight.has(n.id) && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-label="New" />}
                  <button
                    type="button"
                    className="-mr-1 rounded p-0.5 text-muted-foreground opacity-0 hover:text-foreground focus:opacity-100 group-hover:opacity-100"
                    aria-label="Dismiss"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeNotification(n.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
