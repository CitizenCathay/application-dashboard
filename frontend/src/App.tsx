import { useState, useMemo } from "react";
import { useJobs } from "./hooks/useJobs";
import { api } from "./api/client";
import type { Job, Status, EnrichResult } from "./types";

const STATUSES: Status[] = ["Saved", "Applied", "OA", "Interview", "Offer", "Rejected"];

const STATUS_COLORS: Record<string, string> = {
  Saved: "#6c757d",
  Applied: "#0077b6",
  OA: "#7209b7",
  Interview: "#e85d04",
  Offer: "#2d6a4f",
  Rejected: "#c1121f",
};

function StatusBadge({ status, onClick }: { status: string; onClick?: (e: React.MouseEvent) => void }) {
  const color = STATUS_COLORS[status] || "#6c757d";
  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-block", padding: "3px 10px", borderRadius: 4,
        fontSize: 11, fontWeight: 600, cursor: onClick ? "pointer" : "default",
        backgroundColor: color + "18", color, border: `1px solid ${color}44`,
      }}
    >
      {status}
    </span>
  );
}

function Tag({ text }: { text: string }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 7px", borderRadius: 3,
      fontSize: 10, fontWeight: 500, backgroundColor: "#e9ecef",
      color: "#495057", marginRight: 4, marginBottom: 2,
    }}>
      {text}
    </span>
  );
}

// ── Shared form fields used by both Add and Edit modals ─────────
function JobForm({
  form,
  setForm,
}: {
  form: Record<string, string>;
  setForm: (f: Record<string, string>) => void;
}) {
  const fields: [string, string][] = [
    ["company", "Company"], ["role", "Role"], ["location", "Location"],
    ["salary", "Salary"], ["job_type", "Job Type"], ["deadline", "Deadline"],
    ["tech_stack", "Tech Stack (comma separated)"], ["url", "Job Posting URL"],
  ];

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {fields.map(([key, label]) => (
          <label key={key} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontSize: 11, textTransform: "uppercase", color: "#888" }}>{label}</span>
            <input
              value={form[key] || ""}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }}
            />
          </label>
        ))}
      </div>
      <label style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 8 }}>
        <span style={{ fontSize: 11, textTransform: "uppercase", color: "#888" }}>Summary</span>
        <textarea
          value={form.summary || ""}
          onChange={(e) => setForm({ ...form, summary: e.target.value })}
          rows={2}
          style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, fontFamily: "inherit" }}
        />
      </label>
    </>
  );
}

// ── Add Job Modal ───────────────────────────────────────────────
function AddJobModal({
  onClose, onAdd,
}: {
  onClose: () => void;
  onAdd: (data: EnrichResult & { url?: string }) => void;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({
    company: "", role: "", location: "", salary: "",
    tech_stack: "", deadline: "", summary: "", job_type: "Internship",
  });
  const [editing, setEditing] = useState(false);

  const handleExtract = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const isUrl = input.trim().startsWith("http");
      const result = isUrl
        ? await api.scrapeAndEnrich(input.trim())
        : await api.enrich(input.trim());
      setForm({
        company: result.company || "",
        role: result.role || "",
        location: result.location || "",
        salary: result.salary || "",
        tech_stack: (result.tech_stack || []).join(", "),
        deadline: result.deadline || "",
        summary: result.summary || "",
        job_type: result.job_type || "Full-time",
      });
      setEditing(true);
    } catch {
      setEditing(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!form.company && !form.role) return;
    onAdd({
      company: form.company || "Unknown",
      role: form.role || "Unknown Role",
      location: form.location || null,
      salary: form.salary || null,
      job_type: form.job_type || null,
      deadline: form.deadline || null,
      summary: form.summary || null,
      tech_stack: form.tech_stack ? form.tech_stack.split(",").map((s) => s.trim()).filter(Boolean) : [],
      url: input.trim().startsWith("http") ? input.trim() : undefined,
    });
    onClose();
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Add Job</h2>
          <button onClick={onClose} style={closeBtn}>×</button>
        </div>

        {!editing ? (
          <>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
              Paste a job posting or URL. The backend will extract structured fields via Ollama.
            </p>
            <textarea
              value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Paste job posting text or URL..."
              rows={8}
              style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8, fontSize: 13, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
              <button onClick={() => setEditing(true)} style={btnSecondary}>Enter manually</button>
              <button onClick={handleExtract} disabled={loading || !input.trim()} style={{ ...btnPrimary, opacity: loading || !input.trim() ? 0.5 : 1 }}>
                {loading ? "Extracting..." : "Extract with AI"}
              </button>
            </div>
          </>
        ) : (
          <>
            <JobForm form={form} setForm={setForm} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
              <button onClick={handleSave} style={btnPrimary}>Save Job</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Edit Job Modal ──────────────────────────────────────────────
function EditJobModal({
  job, onClose, onSave,
}: {
  job: Job;
  onClose: () => void;
  onSave: (id: number, data: Partial<Job>) => void;
}) {
  const [form, setForm] = useState<Record<string, string>>({
    company: job.company || "",
    role: job.role || "",
    location: job.location || "",
    salary: job.salary || "",
    job_type: job.job_type || "",
    deadline: job.deadline || "",
    tech_stack: (job.tech_stack || []).join(", "),
    summary: job.summary || "",
    url: job.url || "",
  });

  const handleSave = () => {
    onSave(job.id, {
      company: form.company || job.company,
      role: form.role || job.role,
      location: form.location || null,
      salary: form.salary || null,
      job_type: form.job_type || null,
      deadline: form.deadline || null,
      summary: form.summary || null,
      url: form.url || null,
      tech_stack: form.tech_stack
        ? form.tech_stack.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
    });
    onClose();
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Edit Job</h2>
          <button onClick={onClose} style={closeBtn}>×</button>
        </div>
        <JobForm form={form} setForm={setForm} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
          <button onClick={onClose} style={btnSecondary}>Cancel</button>
          <button onClick={handleSave} style={btnPrimary}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

// ── Job Row ─────────────────────────────────────────────────────
function JobRow({
  job, onUpdate, onDelete,
}: {
  job: Job;
  onUpdate: (id: number, data: Partial<Job>) => void;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(job.notes || "");
  const [showEdit, setShowEdit] = useState(false);

  const cycleStatus = () => {
    const idx = STATUSES.indexOf(job.status);
    const next = STATUSES[(idx + 1) % STATUSES.length];
    onUpdate(job.id, { status: next });
  };

  return (
    <>
      <div style={{ backgroundColor: "#f8f9fa", borderRadius: 8, overflow: "hidden" }}>
        <div
          onClick={() => setExpanded(!expanded)}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", cursor: "pointer", flexWrap: "wrap", gap: 8 }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              {job.company}
              {job.url && (
                <a href={job.url} target="_blank" rel="noreferrer" title="View job posting" onClick={e => e.stopPropagation()} style={{ color: "#aaa", display: "inline-flex", lineHeight: 1 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              )}
            </div>
            <div style={{ fontSize: 13, color: "#555", marginTop: 1 }}>{job.role}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {job.location && <span style={{ fontSize: 12, color: "#888" }}>{job.location}</span>}
            <StatusBadge status={job.status} onClick={(e) => { e.stopPropagation(); cycleStatus(); }} />
            <span style={{ fontSize: 11, color: "#aaa" }}>{job.created_at?.slice(0, 10)}</span>
          </div>
        </div>

        {expanded && (
          <div style={{ padding: "0 16px 14px", borderTop: "1px solid #e9ecef" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, marginTop: 12, fontSize: 13 }}>
              {job.salary && <div><span style={labelStyle}>Salary</span> {job.salary}</div>}
              {job.job_type && <div><span style={labelStyle}>Type</span> {job.job_type}</div>}
              {job.deadline && <div><span style={labelStyle}>Deadline</span> {job.deadline}</div>}
            </div>

            {job.tech_stack?.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <span style={labelStyle}>Tech Stack</span>
                <div style={{ marginTop: 4 }}>{job.tech_stack.map((t) => <Tag key={t} text={t} />)}</div>
              </div>
            )}

            {job.summary && (
              <div style={{ marginTop: 10 }}>
                <span style={labelStyle}>Summary</span>
                <p style={{ fontSize: 13, color: "#444", lineHeight: 1.5, marginTop: 4 }}>{job.summary}</p>
              </div>
            )}

            <div style={{ marginTop: 10 }}>
              <span style={labelStyle}>Notes</span>
              <textarea
                value={notes} onChange={(e) => setNotes(e.target.value)}
                onBlur={() => onUpdate(job.id, { notes })}
                placeholder="Interview prep, contacts, follow-ups..."
                rows={2}
                style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 6, fontSize: 12, marginTop: 4, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
              <select
                value={job.status}
                onChange={(e) => onUpdate(job.id, { status: e.target.value as Status })}
                style={{ padding: "5px 10px", borderRadius: 5, border: "1px solid #ddd", fontSize: 12 }}
              >
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <button
                onClick={() => setShowEdit(true)}
                style={{ padding: "5px 12px", backgroundColor: "#0077b618", color: "#0077b6", border: "1px solid #0077b644", borderRadius: 5, cursor: "pointer", fontSize: 12 }}
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(job.id)}
                style={{ padding: "5px 12px", backgroundColor: "#c1121f18", color: "#c1121f", border: "1px solid #c1121f44", borderRadius: 5, cursor: "pointer", fontSize: 12 }}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {showEdit && (
        <EditJobModal
          job={job}
          onClose={() => setShowEdit(false)}
          onSave={onUpdate}
        />
      )}
    </>
  );
}

// ── App ─────────────────────────────────────────────────────────
export default function App() {
  const { jobs, loading, error, addJob, updateJob, deleteJob } = useJobs();
  const [showAdd, setShowAdd] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (filterStatus !== "All" && j.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return j.company.toLowerCase().includes(q) || j.role.toLowerCase().includes(q) || j.tech_stack.some((t) => t.toLowerCase().includes(q));
      }
      return true;
    });
  }, [jobs, filterStatus, search]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { All: jobs.length };
    STATUSES.forEach((s) => { c[s] = jobs.filter((j) => j.status === s).length; });
    return c;
  }, [jobs]);

  const handleAdd = async (data: EnrichResult & { url?: string }) => {
    await addJob({
      company: data.company || "Unknown",
      role: data.role || "Unknown Role",
      location: data.location,
      salary: data.salary,
      job_type: data.job_type,
      deadline: data.deadline,
      summary: data.summary,
      tech_stack: data.tech_stack || [],
      url: data.url || null,
      status: "Saved",
    });
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Application Dashboard</h1>
          <p style={{ fontSize: 13, color: "#888", marginTop: 2 }}>{jobs.length} applications tracked</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={btnPrimary}>+ Add Job</button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 16 }}>
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search company, role, or tech..."
          style={{ padding: "7px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, width: 220 }}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {["All", ...STATUSES].map((s) => (
            <button
              key={s} onClick={() => setFilterStatus(s)}
              style={{
                padding: "4px 10px", borderRadius: 5, fontSize: 11, cursor: "pointer", fontWeight: 500,
                border: `1px solid ${filterStatus === s ? (STATUS_COLORS[s] || "#333") + "44" : "#ddd"}`,
                backgroundColor: filterStatus === s ? (STATUS_COLORS[s] || "#333") + "18" : "transparent",
                color: filterStatus === s ? STATUS_COLORS[s] || "#333" : "#888",
              }}
            >
              {s} ({statusCounts[s] || 0})
            </button>
          ))}
        </div>
      </div>

      {loading && <p style={{ textAlign: "center", color: "#888", padding: 40 }}>Loading...</p>}
      {error && <p style={{ textAlign: "center", color: "#c1121f", padding: 40 }}>{error}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.map((job) => (
          <JobRow key={job.id} job={job} onUpdate={(id, data) => updateJob(id, data)} onDelete={(id) => deleteJob(id)} />
        ))}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#aaa" }}>
            No jobs match your filters. Click "+ Add Job" to get started.
          </div>
        )}
      </div>

      {showAdd && <AddJobModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  );
}

// ── Shared styles ───────────────────────────────────────────────
const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16,
};
const modal: React.CSSProperties = {
  backgroundColor: "#fff", borderRadius: 12, padding: 24,
  width: "100%", maxWidth: 560, maxHeight: "85vh", overflowY: "auto",
};
const btnPrimary: React.CSSProperties = {
  padding: "8px 18px", backgroundColor: "#0077b6", color: "#fff",
  border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
};
const btnSecondary: React.CSSProperties = {
  padding: "8px 16px", backgroundColor: "transparent", color: "#555",
  border: "1px solid #ccc", borderRadius: 6, cursor: "pointer", fontSize: 13,
};
const closeBtn: React.CSSProperties = {
  background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888",
};
const labelStyle: React.CSSProperties = {
  fontSize: 10, textTransform: "uppercase", color: "#888", letterSpacing: 0.5, display: "block", marginBottom: 2,
};