import { useEffect, useState } from "react";
import { Send, X } from "lucide-react";
import { getSiteSettings } from "@/lib/site.api";

const DISMISS_KEY = "binly.telegram_popup_dismissed";

export function TelegramPopup() {
  const [telegramUrl, setTelegramUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY)) return;
    getSiteSettings()
      .then((s) => {
        if (s.telegram_url) {
          setTelegramUrl(s.telegram_url);
          setOpen(true);
        }
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
  };

  if (!open || !telegramUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Join our Telegram channel"
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-glow"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-sm">
            <Send className="h-7 w-7 text-primary-foreground" />
          </span>
          <h2 className="mt-4 font-display text-xl font-bold text-foreground">
            Join our Telegram channel
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Get instant BIN updates, new database entries and announcements directly on Telegram.
          </p>
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={dismiss}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
            Join Channel
          </a>
          <button
            onClick={dismiss}
            className="mt-3 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            No thanks, maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
