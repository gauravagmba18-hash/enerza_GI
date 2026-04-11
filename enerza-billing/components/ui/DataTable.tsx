"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus, Pencil, Trash2, Download, Upload, Search,
  ChevronLeft, ChevronRight, X, Check, Loader2, Eye
} from "lucide-react";
import { useRouter } from "next/navigation";

export interface Column {
  key: string;
  label: string;
  type?: string;
}

interface DataTableProps {
  title: string;
  apiPath: string;       // e.g. "/api/customers"
  columns: Column[];
  color?: string;
  detailPath?: string;   // e.g. "/customers" -> will link to /customers/[id]
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)", animation: "fadeIn 0.2s ease" }}>
      <div className="glass" style={{ width: "min(640px,96vw)", maxHeight: "90vh", overflowY: "auto", padding: 32, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.5px" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--card-border)", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--muted)", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--foreground)"} onMouseLeave={e => e.currentTarget.style.color = "var(--muted)"}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ col, value, onChange }: { col: Column; value: unknown; onChange: (v: unknown) => void }) {
  const base: React.CSSProperties = { 
    width: "100%", 
    background: "rgba(255,255,255,0.03)", 
    border: "1px solid var(--card-border)", 
    borderRadius: 14, 
    padding: "12px 16px", 
    fontSize: 14, 
    color: "var(--foreground)", 
    outline: "none", 
    transition: "all 0.2s" 
  };
  if (col.type === "boolean") {
    return (
      <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px solid var(--card-border)" }}>
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} style={{ width: 18, height: 18, cursor: "pointer", accentColor: "var(--accent)" }} />
        <span style={{ fontSize: 13, color: "var(--foreground)", fontWeight: 600 }}>{col.label}</span>
      </label>
    );
  }
  return (
    <input
      type={col.type === "number" ? "number" : col.type === "date" ? "date" : col.type === "email" ? "email" : "text"}
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
      placeholder={`Enter ${col.label.toLowerCase()}...`}
      style={base}
      onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)", e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
      onBlur={e => (e.currentTarget.style.borderColor = "var(--card-border)", e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
    />
  );
}

export function DataTable({ title, apiPath, columns, color = "#3b82f6", detailPath }: DataTableProps) {
  const router = useRouter();
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<"add" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const limit = 25;

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiPath}?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
      const json = await res.json();
      
      // Handle both { data: { data: [], total: X } } and legacy { data: [] }
      const incomingData = json.data;
      if (incomingData && typeof incomingData === 'object' && !Array.isArray(incomingData)) {
          setRows(incomingData.data ?? []);
          setTotal(incomingData.total ?? (incomingData.data?.length || 0));
      } else {
          setRows(Array.isArray(incomingData) ? incomingData : []);
          setTotal(Array.isArray(incomingData) ? incomingData.length : 0);
      }
    } catch {

      showToast("Failed to load data", "err");
    } finally {
      setLoading(false);
    }
  }, [apiPath, page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => {
    const init: Record<string, unknown> = {};
    columns.forEach((c) => (init[c.key] = c.type === "boolean" ? false : ""));
    setForm(init);
    setModal("add");
  };

  const openEdit = (row: Record<string, unknown>) => {
    setSelected(row);
    setForm({ ...row });
    setModal("edit");
  };

  const openDelete = (row: Record<string, unknown>) => {
    setSelected(row);
    setModal("delete");
  };

  const getIdField = () => {
    const keys = Object.keys(rows[0] ?? {});
    return keys.find((k) => k.endsWith("Id") || k === "errorCode" || k === "id") ?? keys[0];
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const idField = getIdField();
      const id = selected?.[idField];
      const url = modal === "edit" ? `${apiPath}/${id}` : apiPath;
      const method = modal === "edit" ? "PUT" : "POST";
      const body = { ...form };
      if (modal === "add") delete body[idField];
      ["createdAt", "updatedAt"].forEach((k) => delete body[k]);

      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      showToast(modal === "edit" ? "Updated successfully" : "Created successfully");
      setModal(null);
      fetchData();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Error", "err");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const idField = getIdField();
      const id = selected?.[idField];
      const res = await fetch(`${apiPath}/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error(await res.text());
      showToast("Deleted successfully");
      setModal(null);
      fetchData();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Error", "err");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    const res = await fetch(`${apiPath}?export=1`);
    if (!res.ok) { showToast("Export failed", "err"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${apiPath.replace("/api/", "")}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded!");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const buf = await file.arrayBuffer();
    const res = await fetch(apiPath, { method: "POST", headers: { "Content-Type": "application/octet-stream" }, body: buf });
    const json = await res.json();
    if (!res.ok) { showToast(json.error ?? "Import failed", "err"); }
    else { showToast(`Imported ${json.data?.imported ?? 0} rows`); fetchData(); }
    if (fileRef.current) fileRef.current.value = "";
  };

  const totalPages = Math.ceil(total / limit);

  const cellValue = (v: unknown) => {
    if (v === null || v === undefined) return <span style={{ color: "var(--muted)" }}>—</span>;
    if (typeof v === "boolean") return v ? <div style={{ color: "var(--success)", display: "flex", alignItems: "center" }}><Check size={14} strokeWidth={3} /></div> : <div style={{ color: "var(--muted)", display: "flex", alignItems: "center" }}><X size={14} /></div>;
    const str = String(v);
    if (str.length > 40) return <span title={str}>{str.slice(0, 40)}…</span>;
    return str;
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 32, right: 32, zIndex: 200, padding: "14px 24px", borderRadius: 12, background: toast.type === "ok" ? "var(--success)" : "var(--danger)", color: "#fff", fontSize: 14, fontWeight: 600, boxShadow: "0 12px 24px rgba(0,0,0,0.3)", animation: "fadeIn 0.2s ease", display: "flex", alignItems: "center", gap: 10 }}>
          {toast.type === "ok" ? <Check size={18} /> : <X size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--foreground)", letterSpacing: "-1px" }}>{title}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
             <div style={{ width: 4, height: 4, borderRadius: "50%", background: color }} />
             <p style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>{total.toLocaleString()} REGISTERED ENTITIES</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button suppressHydrationWarning onClick={handleExport} className="glass" style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 12, color: "var(--foreground)", fontSize: 13, cursor: "pointer", fontWeight: 700, transition: "all 0.2s" }}>
            <Download size={15} /> Export
          </button>
          <label className="glass" style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 12, color: "var(--foreground)", fontSize: 13, cursor: "pointer", fontWeight: 700, transition: "all 0.2s" }}>
            <Upload size={15} /> Import
            <input suppressHydrationWarning ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={handleImport} />
          </label>
          <button suppressHydrationWarning onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 12, background: color, border: "none", color: "#fff", fontSize: 14, cursor: "pointer", fontWeight: 800, boxShadow: `0 10px 20px ${color}44`, transition: "all 0.2s" }}>
            <Plus size={18} strokeWidth={3} /> Register New
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 32, maxWidth: 460 }}>
        <Search size={16} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
        <input
          suppressHydrationWarning
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={`Find ${title.toLowerCase()} by ID, name, or metadata...`}
          style={{ width: "100%", background: "rgba(255,255,255,0.02)", border: "1px solid var(--card-border)", borderRadius: 16, padding: "14px 16px 14px 48px", fontSize: 14, color: "var(--foreground)", outline: "none", transition: "all 0.2s", fontWeight: 500 }}
        />
      </div>

      {/* Table */}
      <div className="glass" style={{ overflow: "hidden", border: "1px solid var(--card-border)", boxShadow: "0 20px 40px -15px rgba(0,0,0,0.3)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)", background: "rgba(255,255,255,0.03)" }}>
                {columns.map((c) => (
                  <th key={c.key} style={{ textAlign: "left", padding: "18px 24px", fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.15em", whiteSpace: "nowrap" }}>{c.label}</th>
                ))}
                <th style={{ textAlign: "right", padding: "18px 24px", fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.15em" }}>Controls</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length + 1} style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>
                  <Loader2 size={24} style={{ margin: "auto", animation: "spin 1s linear infinite", color: "var(--accent)" }} />
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={columns.length + 1} style={{ textAlign: "center", padding: 60, color: "var(--muted)", fontSize: 15, fontWeight: 500 }}>No records found in this domain.</td></tr>
              ) : rows.map((row, ri) => (
                <tr key={ri} style={{ borderBottom: "1px solid var(--card-border)", transition: "all 0.15s", cursor: detailPath ? "pointer" : "default" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  onClick={() => {
                    if (detailPath) {
                      const id = row[getIdField()];
                      router.push(`${detailPath}/${id}`);
                    }
                  }}
                >
                  {columns.map((c) => (
                    <td key={c.key} style={{ padding: "14px 20px", fontSize: 14, color: "var(--foreground)", whiteSpace: "nowrap", fontWeight: 500 }}>
                      {cellValue(row[c.key])}
                    </td>
                  ))}
                  <td style={{ padding: "14px 20px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: "inline-flex", gap: 8 }}>
                      {detailPath && (
                         <button onClick={() => router.push(`${detailPath}/${row[getIdField()]}`)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--card-border)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "var(--accent)", display: "flex", alignItems: "center", transition: "all 0.2s" }} onMouseEnter={e => (e.currentTarget.style.background = "var(--accent)", e.currentTarget.style.color = "#fff")} onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)", e.currentTarget.style.color = "var(--accent)")}>
                            <Eye size={14} strokeWidth={2.5} />
                         </button>
                      )}
                      <button onClick={() => openEdit(row)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--card-border)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: color, display: "flex", alignItems: "center", transition: "all 0.2s" }} onMouseEnter={e => (e.currentTarget.style.background = color, e.currentTarget.style.color = "#fff")} onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)", e.currentTarget.style.color = color)}>
                        <Pencil size={14} strokeWidth={2.5} />
                      </button>
                      <button onClick={() => openDelete(row)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--card-border)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "var(--danger)", display: "flex", alignItems: "center", transition: "all 0.2s" }} onMouseEnter={e => (e.currentTarget.style.background = "var(--danger)", e.currentTarget.style.color = "#fff")} onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)", e.currentTarget.style.color = "var(--danger)")}>
                        <Trash2 size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderTop: "1px solid var(--card-border)", background: "rgba(255,255,255,0.01)" }}>
            <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>Page <span style={{ color: "var(--foreground)" }}>{page}</span> of {totalPages}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--card-border)", borderRadius: 8, padding: "6px 14px", cursor: "pointer", color: "var(--foreground)", opacity: page === 1 ? 0.3 : 1, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}>
                <ChevronLeft size={16} /> Prev
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--card-border)", borderRadius: 8, padding: "6px 14px", cursor: "pointer", color: "var(--foreground)", opacity: page === totalPages ? 0.3 : 1, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}>
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {(modal === "add" || modal === "edit") && (
        <Modal title={modal === "add" ? `Register New ${title.slice(0, -1)}` : `Modify ${title.slice(0, -1)}`} onClose={() => setModal(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {columns.filter((c) => !["createdAt", "updatedAt"].includes(c.key)).map((c) => (
              <div key={c.key} style={{ gridColumn: c.type === "boolean" ? "span 2" : "span 1" }}>
                {c.type !== "boolean" && <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{c.label}</label>}
                <FormField col={c} value={form[c.key]} onChange={(v) => setForm((f) => ({ ...f, [c.key]: v }))} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--card-border)" }}>
            <button onClick={() => setModal(null)} style={{ padding: "10px 24px", borderRadius: 10, background: "transparent", border: "1px solid var(--card-border)", color: "var(--foreground)", fontSize: 14, cursor: "pointer", fontWeight: 600, transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ padding: "10px 28px", borderRadius: 10, background: color, border: "none", color: "#fff", fontSize: 14, cursor: "pointer", fontWeight: 700, boxShadow: `0 8px 16px ${color}33`, opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8 }}>
              {saving ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Syncing…</> : (modal === "add" ? "Create Record" : "Update Changes")}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {modal === "delete" && (
        <Modal title="Confirm Removal" onClose={() => setModal(null)}>
          <div style={{ padding: "8px 0" }}>
            <p style={{ fontSize: 15, color: "var(--foreground)", lineHeight: 1.6, marginBottom: 24 }}>Are you absolutely sure you want to remove this record from the <strong>{title}</strong> database? This action is permanent and may affect linked accounts.</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button onClick={() => setModal(null)} style={{ padding: "10px 24px", borderRadius: 10, background: "transparent", border: "1px solid var(--card-border)", color: "var(--foreground)", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>Keep Record</button>
              <button onClick={handleDelete} disabled={saving} style={{ padding: "10px 28px", borderRadius: 10, background: "var(--danger)", border: "none", color: "#fff", fontSize: 14, cursor: "pointer", fontWeight: 700, boxShadow: "0 8px 16px rgba(239, 68, 68, 0.25)" }}>
                {saving ? "Processing…" : "Confirm Delete"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}
