"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CreditCard, GraduationCap, ClipboardList, MessageSquare, BellOff } from "lucide-react";
import { useNotifications, useMarkRead, useMarkAllRead } from "./notifications.hook";

const TYPE_ICON: Record<string, React.ElementType> = {
  PAYMENT:     CreditCard,
  ENROLLMENT:  GraduationCap,
  QUIZ_RESULT: ClipboardList,
  QA_REPLY:    MessageSquare,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)   return "Vừa xong";
  if (mins < 60)  return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  return `${days} ngày trước`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref             = useRef<HTMLDivElement>(null);
  const router          = useRouter();

  const { data }      = useNotifications();
  const markRead      = useMarkRead();
  const markAllRead   = useMarkAllRead();

  const notifications = data?.notifications ?? [];
  const unreadCount   = data?.unread_count ?? 0;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleNotificationClick = (id: string, link: string | null) => {
    markRead.mutate(id);
    setOpen(false);
    if (link) router.push(link);
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#f0f2f5] transition-colors"
      >
        <Bell size={18} className="text-[rgba(4,14,32,0.6)]" strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-11 w-80 bg-white rounded-2xl border border-[#e0e2e6] overflow-hidden z-50"
          style={{ boxShadow: "rgba(15,48,106,0.12) 0px 8px 32px" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f2f5]">
            <span className="text-sm font-semibold text-[#181d26]">Thông báo</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-xs text-[#1b61c9] hover:underline font-medium"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#f0f2f5]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-[rgba(4,14,32,0.4)]">
                <BellOff size={28} className="mb-2 opacity-40" />
                <p className="text-sm">Chưa có thông báo nào</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = TYPE_ICON[n.type] ?? Bell;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n.id, n.link)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[#f8fafc] transition-colors ${!n.is_read ? "bg-[#f0f4fb]" : ""}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${!n.is_read ? "bg-[#1b61c9]/15 text-[#1b61c9]" : "bg-[#f0f2f5] text-[rgba(4,14,32,0.45)]"}`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${!n.is_read ? "font-semibold text-[#181d26]" : "font-medium text-[#181d26]"}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-[rgba(4,14,32,0.55)] truncate mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-[rgba(4,14,32,0.35)] mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.is_read && (
                      <div className="w-2 h-2 rounded-full bg-[#1b61c9] shrink-0 mt-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
