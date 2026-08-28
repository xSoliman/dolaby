"use client";

import {
  BookHeart,
  ChevronDown,
  CircleHelp,
  House,
  Menu,
  Plus,
  Search,
  Settings,
  Shirt,
  ShoppingBag,
  Sparkles,
  Store,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { initials } from "@/lib/format";
import { Logo } from "@/components/logo";
import { useWardrobe } from "@/components/wardrobe-provider";

const primaryNav = [
  { href: "/home", label: "Today", icon: House },
  { href: "/closet", label: "My closet", icon: Shirt },
  { href: "/outfits", label: "Outfits", icon: Sparkles },
  { href: "/diary", label: "Wear diary", icon: BookHeart },
  { href: "/stores", label: "Stores", icon: Store },
];

const mobileNav = primaryNav;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, authReady, isConfigured, isDemo, items } = useWardrobe();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (authReady && isConfigured && !isDemo && !profile) router.replace("/");
  }, [authReady, isConfigured, isDemo, profile, router]);

  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!authReady || (isConfigured && !isDemo && !profile)) {
    return (
      <div className="app-loading">
        <Logo />
        <span className="loading-dot" />
      </div>
    );
  }

  const results = query.trim()
    ? items
        .filter((item) =>
          `${item.name} ${item.type} ${item.primaryColor}`.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 5)
    : [];

  const nav = (
    <>
      <div className="sidebar-head">
        <Logo />
        <button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
          <X size={20} />
        </button>
      </div>

      <Link href="/closet/new" className="quick-add">
        <span>
          <Plus size={18} />
          Add an item
        </span>
        <kbd>+</kbd>
      </Link>

      <nav className="sidebar-nav" aria-label="Main navigation">
        <p className="nav-label">Wardrobe</p>
        {primaryNav.map((entry) => {
          const active = pathname === entry.href || pathname.startsWith(`${entry.href}/`);
          const Icon = entry.icon;
          return (
            <Link href={entry.href} className={active ? "active" : ""} key={entry.href}>
              <Icon size={19} strokeWidth={active ? 2.1 : 1.7} />
              <span>{entry.label}</span>
              {entry.href === "/closet" ? <small>{items.length}</small> : null}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-spacer" />

      <nav className="sidebar-nav utility-nav" aria-label="Secondary navigation">
        <Link href="/settings" className={pathname === "/settings" ? "active" : ""}>
          <Settings size={18} />
          <span>Settings</span>
        </Link>
        <a href="mailto:hello@dolaby.app">
          <CircleHelp size={18} />
          <span>Help & feedback</span>
        </a>
      </nav>

      {isDemo ? (
        <div className="demo-badge">
          <span className="status-dot" />
          <div>
            <strong>Demo wardrobe</strong>
            <small>Changes save on this device</small>
          </div>
        </div>
      ) : null}

      <Link href="/settings" className="profile-chip">
        <span className="avatar">{initials(profile?.name ?? "D")}</span>
        <span>
          <strong>{profile?.name ?? "My wardrobe"}</strong>
          <small>{profile?.email}</small>
        </span>
        <ChevronDown size={16} />
      </Link>
    </>
  );

  return (
    <div className="app-frame">
      <aside className="sidebar">{nav}</aside>

      {mobileOpen ? (
        <div className="mobile-drawer-backdrop" onClick={() => setMobileOpen(false)}>
          <aside className="mobile-drawer" onClick={(event) => event.stopPropagation()}>
            {nav}
          </aside>
        </div>
      ) : null}

      <div className="app-column">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu size={21} />
          </button>
          <button className="global-search" onClick={() => setSearchOpen(true)}>
            <Search size={17} />
            <span>Search your wardrobe</span>
            <kbd>⌘ K</kbd>
          </button>
          <Link className="topbar-action" href="/diary?log=true">
            <ShoppingBag size={17} />
            Log today&apos;s wear
          </Link>
          <Link href="/closet/new" className="topbar-add" aria-label="Add item">
            <Plus size={18} />
          </Link>
          <span className="topbar-avatar">{initials(profile?.name ?? "D")}</span>
        </header>
        <main className="app-main">{children}</main>
      </div>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {mobileNav.map((entry) => {
          const Icon = entry.icon;
          const active = pathname === entry.href || pathname.startsWith(`${entry.href}/`);
          return (
            <Link href={entry.href} className={active ? "active" : ""} key={entry.href}>
              <Icon size={20} />
              <span>{entry.label.replace("My ", "")}</span>
            </Link>
          );
        })}
      </nav>

      {searchOpen ? (
        <div className="search-backdrop" onMouseDown={() => setSearchOpen(false)}>
          <div className="search-dialog" onMouseDown={(event) => event.stopPropagation()}>
            <div className="search-input-wrap">
              <Search size={20} />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, type, or color…"
              />
              <button onClick={() => setSearchOpen(false)}>ESC</button>
            </div>
            <div className="search-results">
              {!query ? (
                <div className="search-hint">
                  <span><Shirt size={18} /> Try “linen”</span>
                  <span><Sparkles size={18} /> Find an outfit</span>
                </div>
              ) : results.length ? (
                results.map((item) => (
                  <Link
                    href={`/closet/${item.id}`}
                    key={item.id}
                    onClick={() => setSearchOpen(false)}
                  >
                    <span className="search-thumb">
                      {item.photos[0] ? <img src={item.photos[0]} alt="" /> : <Shirt size={17} />}
                    </span>
                    <span>
                      <strong>{item.name || item.type}</strong>
                      <small>{item.primaryColor} · {item.type}</small>
                    </span>
                  </Link>
                ))
              ) : (
                <p className="no-search-results">Nothing in your wardrobe matches “{query}”.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
