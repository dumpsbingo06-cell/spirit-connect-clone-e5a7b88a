import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader({ variant = "default" }: { variant?: "default" | "forum" }) {
  const forumMode = variant === "forum";
  const navLinkClass = forumMode
    ? "relative rounded-none px-3 py-2 font-semibold text-forum-muted transition-colors hover:bg-forum-raised hover:text-forum-ink [&.active]:text-forum-accent [&.active]:after:absolute [&.active]:after:inset-x-2 [&.active]:after:-bottom-2 [&.active]:after:h-0.5 [&.active]:after:bg-forum-accent"
    : "rounded-md px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&.active]:text-foreground";
  return (
    <header className={forumMode
      ? "sticky top-0 z-40 w-full border-b border-forum-accent/70 bg-forum-canvas/95 text-forum-ink backdrop-blur"
      : "sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70"}>
      <div className="mx-auto flex min-h-14 w-full max-w-6xl flex-wrap items-center justify-between gap-y-2 px-4 py-2 sm:flex-nowrap">
        <Link to="/" className="group inline-flex items-center gap-3" aria-label="Binly home">
          <span className={forumMode
            ? "flex h-9 w-9 items-center justify-center border border-forum-accent/70 bg-forum-raised"
            : "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-sm"}>
            <ShieldCheck className={forumMode ? "h-5 w-5 text-forum-accent" : "h-5 w-5 text-primary-foreground"} strokeWidth={2.5} />
          </span>
          <span className="flex flex-col items-start">
            <span className={`font-display text-lg font-bold leading-tight tracking-tight ${forumMode ? "text-forum-ink" : "text-foreground"}`}>
              Binly
            </span>
          </span>

        </Link>
        <nav className={`flex max-w-full flex-wrap items-center gap-1 text-sm ${forumMode ? "text-forum-ink" : ""}`} aria-label="Primary">
          <Link
            to="/"
            className={navLinkClass}
            activeOptions={{ exact: true }}
          >
            Lookup
          </Link>
          <Link
            to="/bin-list"
            className={navLinkClass}
          >
            BIN List
          </Link>
          <Link
            to="/bins"
            className={navLinkClass}
          >
            Categories
          </Link>

          <Link
            to="/contact"
            className={navLinkClass}
          >
            Contact
          </Link>

          <div className={forumMode ? "ml-1 [--background:var(--forum-canvas)] [--foreground:var(--forum-ink)] [--border:var(--forum-line)] [--muted:var(--forum-raised)]" : "ml-1"}>
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
