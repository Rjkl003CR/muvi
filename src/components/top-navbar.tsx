"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  Menu,
  Bell,
  User,
  Settings,
  LogOut,
  Check,
  Trash2,
  CheckCheck,
  Trash,
  ChevronDown,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useSidebar } from "./sidebar-context";

/* ── Mock notifications (replace with real data later) ── */
interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  time: string;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "Download Complete",
    message: "Inception (2010) saved to your library.",
    read: false,
    time: "2m ago",
  },
  {
    id: "2",
    title: "New Feature",
    message: "Chat and Notes are now available!",
    read: false,
    time: "1h ago",
  },
  {
    id: "3",
    title: "Storage Warning",
    message: "You're using 80% of your Drive quota.",
    read: true,
    time: "1d ago",
  },
];

export function TopNavbar() {
  const router = useRouter();
  const supabase = createClient();
  const { toggle } = useSidebar();

  const [user, setUser] = useState<any>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  /* Auth state */
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  /* Close dropdowns on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  const deleteNotif = (id: string) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const deleteAll = () => setNotifications([]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("google_access_token");
    setProfileOpen(false);
  };

  /* User avatar: profile image or initial */
  const avatarInitial = user?.email?.[0]?.toUpperCase() ?? "?";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <header className="top-navbar">
      {/* ── Left: hamburger ── */}
      <button
        id="sidebar-toggle-btn"
        onClick={toggle}
        aria-label="Toggle sidebar"
        className="navbar-icon-btn"
      >
        <Menu style={{ width: 20, height: 20 }} />
      </button>

      {/* ── Right: theme · notifications · profile ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            id="notifications-btn"
            onClick={() => {
              setNotifOpen((o) => !o);
              setProfileOpen(false);
            }}
            aria-label="Notifications"
            className="navbar-icon-btn"
            style={{ position: "relative" }}
          >
            <Bell style={{ width: 20, height: 20 }} />
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount}</span>
            )}
          </button>

          {notifOpen && (
            <div className="notif-dropdown">
              {/* Header */}
              <div className="notif-dropdown-header">
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="badge badge-accent">{unreadCount} new</span>
                )}
              </div>

              {/* Items */}
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notif-item${n.read ? "" : " notif-item-unread"}`}
                    >
                      <div className="notif-item-body">
                        <p className="notif-item-title">{n.title}</p>
                        <p className="notif-item-msg">{n.message}</p>
                        <span className="notif-item-time">{n.time}</span>
                      </div>
                      <div className="notif-item-actions">
                        {!n.read && (
                          <button
                            onClick={() => markRead(n.id)}
                            className="notif-action-btn"
                            title="Mark as read"
                          >
                            <Check style={{ width: 13, height: 13 }} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotif(n.id)}
                          className="notif-action-btn notif-action-delete"
                          title="Delete"
                        >
                          <Trash2 style={{ width: 13, height: 13 }} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer actions */}
              {notifications.length > 0 && (
                <div className="notif-dropdown-footer">
                  <button onClick={markAllRead} className="notif-footer-btn">
                    <CheckCheck style={{ width: 14, height: 14 }} />
                    Mark All Read
                  </button>
                  <button
                    onClick={deleteAll}
                    className="notif-footer-btn notif-footer-delete"
                  >
                    <Trash style={{ width: 14, height: 14 }} />
                    Delete All
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile */}
        <div ref={profileRef} style={{ position: "relative" }}>
          <button
            id="profile-btn"
            onClick={() => {
              setProfileOpen((o) => !o);
              setNotifOpen(false);
            }}
            aria-label="Profile menu"
            className="profile-avatar-btn"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="avatar"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div className="profile-avatar-fallback">{avatarInitial}</div>
            )}
            <ChevronDown
              style={{
                width: 14,
                height: 14,
                color: "var(--text-muted)",
                transition: "transform 0.2s",
                transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>

          {profileOpen && (
            <div className="profile-dropdown">
              {/* User info */}
              <div className="profile-dropdown-header">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    className="profile-avatar-fallback"
                    style={{ width: 38, height: 38, fontSize: "1rem" }}
                  >
                    {avatarInitial}
                  </div>
                )}
                <div>
                  <p className="profile-dropdown-name">
                    {user?.user_metadata?.full_name ??
                      user?.email?.split("@")[0] ??
                      "Guest"}
                  </p>
                  <p className="profile-dropdown-email">{user?.email ?? ""}</p>
                </div>
              </div>

              <div className="profile-dropdown-divider" />

              <button
                className="profile-dropdown-item"
                onClick={() => {
                  router.push("/settings/profile");
                  setProfileOpen(false);
                }}
              >
                <User style={{ width: 16, height: 16 }} />
                My Profile
              </button>
              <button
                className="profile-dropdown-item"
                onClick={() => {
                  router.push("/settings/account");
                  setProfileOpen(false);
                }}
              >
                <Settings style={{ width: 16, height: 16 }} />
                Settings
              </button>

              <div className="profile-dropdown-divider" />

              {user ? (
                <button
                  className="profile-dropdown-item profile-dropdown-signout"
                  onClick={handleSignOut}
                >
                  <LogOut style={{ width: 16, height: 16 }} />
                  Sign Out
                </button>
              ) : (
                <button
                  className="profile-dropdown-item"
                  onClick={() => {
                    router.push("/auth");
                    setProfileOpen(false);
                  }}
                >
                  <LogOut style={{ width: 16, height: 16 }} />
                  Sign In
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
