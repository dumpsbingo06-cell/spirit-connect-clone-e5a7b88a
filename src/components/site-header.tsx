import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link to="/" className="group inline-flex items-center gap-3" aria-label="Binly home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-sm">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </span>
          <span className="flex flex-col items-start">
            <span className="font-display text-lg font-bold leading-tight tracking-tight text-foreground">
              Binly
            </span>
          </span>

        </Link>
        <nav className="flex items-center gap-1 text-sm" aria-label="Primary">
          <Link
            to="/"
            className="rounded-md px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&.active]:text-foreground"
            activeOptions={{ exact: true }}
          >
            Lookup
          </Link>
          <Link
            to="/contact"
            className="rounded-md px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&.active]:text-foreground"
          >
            Contact
          </Link>
          <div className="ml-1">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
