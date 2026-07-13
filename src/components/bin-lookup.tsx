import { useState, type FormEvent, type ReactNode } from "react";
import {
  Search,
  Loader2,
  Database,
  Zap,
  AlertCircle,
  SearchX,
  CreditCard,
  Building2,
  Globe2,
  Sparkles,
  Phone,
  Link as LinkIcon,
  Coins,
  Hash,
  Layers,
  Tag,
  ShieldCheck,
} from "lucide-react";

import { lookupBin, type BinResult } from "@/lib/bin-lookup.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo, schemeLogoUrl } from "@/components/brand-logo";

type ViewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: BinResult }
  | { status: "not_found"; bin: string }
  | { status: "error"; message: string };

type FieldKey = keyof BinResult;

type FieldDef = {
  key: FieldKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const CARD_FIELDS: FieldDef[] = [
  { key: "bin", label: "BIN / IIN", icon: Hash },
  { key: "scheme", label: "Scheme", icon: CreditCard },
  { key: "brand", label: "Brand", icon: Sparkles },
  { key: "cardType", label: "Card Type", icon: Layers },
  { key: "category", label: "Category", icon: Tag },
];

const ISSUER_FIELDS: FieldDef[] = [
  { key: "bankName", label: "Issuing Bank", icon: Building2 },
  { key: "bankUrl", label: "Website", icon: LinkIcon },
  { key: "bankPhone", label: "Phone", icon: Phone },
];

const LOCATION_FIELDS: FieldDef[] = [
  { key: "countryName", label: "Country", icon: Globe2 },
  { key: "countryCode", label: "Country Code", icon: Hash },
  { key: "currency", label: "Currency", icon: Coins },
];

export function BinLookup() {
  const [bin, setBin] = useState("");
  const [view, setView] = useState<ViewState>({ status: "idle" });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const cleaned = bin.replace(/\D/g, "");
    if (cleaned.length < 6) {
      setView({ status: "error", message: "Enter at least the first 6 digits of the card." });
      return;
    }
    setView({ status: "loading" });
    try {
      const outcome = await lookupBin({ bin: cleaned });
      if (outcome.status === "success") setView({ status: "success", data: outcome.data });
      else if (outcome.status === "not_found") setView({ status: "not_found", bin: cleaned });
      else setView({ status: "error", message: outcome.message });
    } catch {
      setView({ status: "error", message: "Something went wrong. Please try again." });
    }
  }

  const data = view.status === "success" ? view.data : null;
  const isLoading = view.status === "loading";
  const hasResult = view.status === "success";

  return (
    <div className="w-full px-4 sm:px-6">
      {/* Hero */}
      <section className="mx-auto max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          Trusted BIN intelligence
        </div>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Identify any card in{" "}
          <span className="bg-gradient-accent bg-clip-text text-transparent">seconds</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground sm:text-lg">
          Look up the issuing bank, scheme, brand, country and contact details behind the first digits of any card.
        </p>
      </section>

      {/* Search bar */}
      <form
        onSubmit={handleSubmit}
        className="mx-auto mt-8 w-full max-w-2xl"
      >
        <div className="group relative rounded-2xl bg-gradient-accent p-[1.5px] shadow-glow transition-all focus-within:shadow-[0_0_0_4px_oklch(0.52_0.16_250_/_0.15),0_20px_50px_-20px_oklch(0.52_0.16_250_/_0.5)]">
          <div className="flex flex-col gap-2 rounded-[calc(1rem-1px)] bg-card p-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                inputMode="numeric"
                autoComplete="off"
                placeholder="Enter first 6 digits (e.g. 457173)"
                value={bin}
                onChange={(e) => setBin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                className="h-14 border-0 bg-transparent pl-12 text-lg font-medium tracking-[0.25em] shadow-none focus-visible:ring-0"
                aria-label="Card BIN"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-14 gap-2 rounded-xl bg-gradient-accent px-8 text-base font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
              {isLoading ? "Checking…" : "Check BIN"}
            </Button>
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Enter 6–8 digits. We never store or share the card number.
        </p>
      </form>

      {/* Alerts */}
      <div className="mx-auto mt-6 w-full max-w-4xl">
        {view.status === "error" && (
          <div className="flex animate-fade-in items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Lookup failed</p>
              <p className="mt-0.5 text-destructive/80">{view.message}</p>
            </div>
          </div>
        )}
        {view.status === "not_found" && (
          <div className="flex animate-fade-in items-start gap-3 rounded-xl border border-border bg-muted/40 p-4 text-sm">
            <SearchX className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-semibold text-foreground">No records found</p>
              <p className="mt-0.5 text-muted-foreground">
                We couldn't locate BIN <span className="font-mono font-semibold">{view.bin}</span>. Try a different card.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {(isLoading || hasResult) && (
        <section className="mx-auto mt-8 w-full max-w-5xl animate-fade-in">
          <ResultsHeader data={data} isLoading={isLoading} />

          {/* Hero summary card */}
          <div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
            <div className="relative bg-gradient-hero p-6 sm:p-8">
              <div className="absolute inset-0 opacity-20 mix-blend-overlay [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <SchemeMark data={data} loading={isLoading} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">
                      BIN
                    </p>
                    {isLoading ? (
                      <div className="mt-1 h-8 w-40 animate-pulse rounded bg-white/20" />
                    ) : (
                      <p className="font-mono text-2xl font-bold tracking-widest text-primary-foreground sm:text-3xl">
                        {data?.bin}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {isLoading ? (
                        <>
                          <span className="h-5 w-16 animate-pulse rounded-full bg-white/20" />
                          <span className="h-5 w-20 animate-pulse rounded-full bg-white/20" />
                        </>
                      ) : (
                        <>
                          {data?.scheme && <Pill>{data.scheme}</Pill>}
                          {data?.cardType && <Pill>{data.cardType}</Pill>}
                          {data?.prepaid && <Pill>Prepaid</Pill>}
                          {data?.commercial && <Pill>Commercial</Pill>}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <CountryDisplay data={data} loading={isLoading} />
              </div>
            </div>
          </div>

          {/* Detail grid */}
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <DetailCard title="Card details" icon={CreditCard} fields={CARD_FIELDS} data={data} loading={isLoading} />
            <DetailCard title="Issuing bank" icon={Building2} fields={ISSUER_FIELDS} data={data} loading={isLoading} />
            <DetailCard title="Location" icon={Globe2} fields={LOCATION_FIELDS} data={data} loading={isLoading} />
          </div>
        </section>
      )}
    </div>
  );
}

function ResultsHeader({ data, isLoading }: { data: BinResult | null; isLoading: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-xl font-semibold text-foreground">Lookup results</h2>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      {data && (
        <span
          className={`inline-flex animate-scale-in items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            data.source === "cache"
              ? "border border-border bg-secondary text-secondary-foreground"
              : "bg-gradient-accent text-primary-foreground shadow-sm"
          }`}
        >
          {data.source === "cache" ? (
            <>
              <Database className="h-3.5 w-3.5" /> Cached
            </>
          ) : (
            <>
              <Zap className="h-3.5 w-3.5" /> Live
            </>
          )}
        </span>
      )}
    </div>
  );
}

function SchemeMark({ data, loading }: { data: BinResult | null; loading: boolean }) {
  const url = data?.scheme ? schemeLogoUrl(data.scheme) : null;
  if (loading) {
    return <div className="h-16 w-24 animate-pulse rounded-xl bg-white/20" />;
  }
  return (
    <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/95 p-2 shadow-lg">
      {url ? (
        <img src={url} alt={`${data?.scheme} logo`} className="max-h-full max-w-full object-contain" />
      ) : (
        <CreditCard className="h-8 w-8 text-primary" />
      )}
    </div>
  );
}

function CountryDisplay({ data, loading }: { data: BinResult | null; loading: boolean }) {
  if (loading) {
    return <div className="h-14 w-40 animate-pulse rounded-xl bg-white/20" />;
  }
  if (!data?.countryName) return null;
  const flagCode = /^[a-z]{2}$/i.test(data.countryCode ?? "") ? data.countryCode!.toLowerCase() : null;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
      {flagCode ? (
        <span
          aria-label={`${data.countryName} flag`}
          className={`fi fi-${flagCode} block h-8 w-12 rounded shadow-sm`}
        />
      ) : (
        <span className="text-3xl leading-none">{data.countryEmoji ?? "🏳️"}</span>
      )}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-primary-foreground/70">
          Country
        </p>
        <p className="font-display text-lg font-semibold uppercase tracking-wide text-primary-foreground">
          {data.countryName}
        </p>
      </div>
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary-foreground backdrop-blur">
      {children}
    </span>
  );
}

function DetailCard({
  title,
  icon: Icon,
  fields,
  data,
  loading,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  fields: FieldDef[];
  data: BinResult | null;
  loading: boolean;
}) {
  return (
    <div className="group rounded-2xl border border-border/60 bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow">
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-accent text-primary-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
          {title}
        </h3>
      </div>
      <dl className="mt-3 space-y-3">
        {fields.map((f) => (
          <FieldRow key={f.key} field={f} data={data} loading={loading} />
        ))}
      </dl>
    </div>
  );
}

function FieldRow({ field, data, loading }: { field: FieldDef; data: BinResult | null; loading: boolean }) {
  const Icon = field.icon;
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {field.label}
        </dt>
        <dd className="mt-0.5 truncate text-sm font-medium text-foreground">
          {loading ? (
            <span className="inline-block h-4 w-32 animate-pulse rounded bg-muted" />
          ) : (
            renderField(field.key, data)
          )}
        </dd>
      </div>
    </div>
  );
}

function renderField(key: FieldKey, data: BinResult | null): ReactNode {
  if (!data) return <Muted>—</Muted>;
  const v = data[key];

  if (key === "scheme" || key === "brand") {
    if (!v) return <Muted>Not published</Muted>;
    return <BrandLogo name={String(v)} />;
  }

  if (key === "countryName") {
    if (!data.countryName) return <Muted>Not published</Muted>;
    const flagCode = /^[a-z]{2}$/i.test(data.countryCode ?? "") ? data.countryCode!.toLowerCase() : null;
    return (
      <span className="inline-flex items-center gap-2">
        {flagCode ? (
          <span className={`fi fi-${flagCode} block h-4 w-6 rounded-sm border border-border shadow-sm`} />
        ) : (
          <span className="text-base leading-none">{data.countryEmoji ?? "🏳️"}</span>
        )}
        <span className="font-semibold uppercase tracking-wide">{data.countryName}</span>
      </span>
    );
  }

  if (key === "bankUrl" && typeof v === "string" && v) {
    const href = v.startsWith("http") ? v : `https://${v}`;
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline-offset-4 hover:underline"
      >
        {v}
      </a>
    );
  }

  if (key === "bankPhone" && typeof v === "string" && v) {
    return (
      <a href={`tel:${v.replace(/[^+\d]/g, "")}`} className="text-primary underline-offset-4 hover:underline">
        {v}
      </a>
    );
  }

  if ((key === "bankUrl" || key === "bankPhone") && (v === null || v === undefined || v === "")) {
    return <Muted>Not published</Muted>;
  }

  if (v === null || v === undefined || v === "") return <Muted>Not published</Muted>;

  if (key === "bin" || key === "countryCode") {
    return <span className="font-mono tracking-wide">{String(v)}</span>;
  }

  return String(v);
}

function Muted({ children }: { children: ReactNode }) {
  return <span className="italic text-muted-foreground/70">{children}</span>;
}
