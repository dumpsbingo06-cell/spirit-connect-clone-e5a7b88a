import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Upload, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  listCategories,
  createCategory,
  deleteCategory,
  addBinsToCategory,
  listCategoryBins,
  deleteCategoryBin,
  parseBinList,
  type BinCategory,
  type CategoryBin,
} from "@/lib/bin-categories.api";

export function AdminCategories() {
  const [cats, setCats] = useState<BinCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [paste, setPaste] = useState("");
  const [bins, setBins] = useState<CategoryBin[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  async function refresh() {
    setLoading(true);
    try { setCats(await listCategories()); } catch (e) { setMsg((e as Error).message); }
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    if (!selected) { setBins([]); return; }
    listCategoryBins(selected).then(setBins).catch(() => setBins([]));
  }, [selected]);

  const current = cats.find((c) => c.id === selected);
  const parsedCount = parseBinList(paste).length;

  return (
    <div className="grid gap-6 md:grid-cols-[280px_1fr]">
      <aside className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">New category</h3>
          <Input className="mt-3" placeholder="e.g. Walmart BINs" value={name} onChange={(e) => setName(e.target.value)} />
          <Input className="mt-2" placeholder="Short description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <Button
            className="mt-3 w-full"
            size="sm"
            disabled={busy || !name.trim()}
            onClick={async () => {
              setBusy(true); setMsg(null);
              try { await createCategory(name, desc); setName(""); setDesc(""); await refresh(); }
              catch (e) { setMsg((e as Error).message); }
              setBusy(false);
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> Add category
          </Button>
        </div>
        <div className="rounded-xl border border-border bg-card p-2">
          {loading ? (
            <Loader2 className="m-3 h-4 w-4 animate-spin" />
          ) : cats.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">No categories yet.</p>
          ) : (
            cats.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelected(c.id)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                  selected === c.id ? "bg-muted font-semibold" : "hover:bg-muted/60"
                }`}
              >
                <span className="truncate">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.bin_count}</span>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="rounded-xl border border-border bg-card p-5">
        {msg && <p className="mb-3 text-sm text-destructive">{msg}</p>}
        {!current ? (
          <p className="text-sm text-muted-foreground">Pick or create a category to paste BINs into it.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-semibold">{current.name}</h3>
                <Link to="/bins/$slug" params={{ slug: current.slug }} target="_blank" className="inline-flex items-center gap-1 text-xs text-primary">
                  /bins/{current.slug} <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <Button
                variant="ghost" size="sm" className="text-destructive"
                onClick={async () => {
                  if (!confirm(`Delete "${current.name}" and all its BINs?`)) return;
                  await deleteCategory(current.id); setSelected(null); refresh();
                }}
              >
                <Trash2 className="mr-1 h-4 w-4" /> Delete category
              </Button>
            </div>

            <label className="mt-5 block text-sm font-medium">Paste BINs (one per line, optional note after)</label>
            <Textarea
              rows={8}
              className="mt-2 font-mono text-sm"
              placeholder={"414720\n440066 works on walmart.com\n531106 | US only"}
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{parsedCount} valid BINs detected</span>
              <Button
                size="sm"
                disabled={busy || parsedCount === 0}
                onClick={async () => {
                  setBusy(true); setMsg(null); setProgress(null);
                  try {
                    const n = await addBinsToCategory(current.id, paste, (done, total) => setProgress({ done, total }));
                    setPaste(""); setMsg(null);
                    setBins(await listCategoryBins(current.id)); refresh();
                    alert(`Uploaded ${n} BINs with full details`);
                  } catch (e) { setMsg((e as Error).message); }
                  setBusy(false); setProgress(null);
                }}
              >
                {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
                {busy && progress ? `Fetching details ${progress.done}/${progress.total}…` : "Upload"}
              </Button>
            </div>

            <h4 className="mt-6 text-sm font-semibold">BINs in this category ({bins.length})</h4>
            <ul className="mt-2 max-h-96 divide-y divide-border overflow-auto rounded-lg border border-border">
              {bins.map((b) => (
                <li key={b.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="font-mono font-semibold">{b.bin}</span>
                  <span className="flex-1 truncate text-muted-foreground">{b.note}</span>
                  <button
                    type="button" aria-label="Remove BIN" className="text-muted-foreground hover:text-destructive"
                    onClick={async () => { await deleteCategoryBin(b.id); setBins((x) => x.filter((y) => y.id !== b.id)); refresh(); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
