import type { Job, JobCreate, JobUpdate, EnrichResult } from "../types";

const BASE = "/api/jobs";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  listJobs(status?: string, search?: string): Promise<Job[]> {
    const params = new URLSearchParams();
    if (status && status !== "All") params.set("status", status);
    if (search) params.set("search", search);
    const qs = params.toString();
    return request(`${BASE}/${qs ? `?${qs}` : ""}`);
  },
  
  getJob(id: number): Promise<Job> {
    return request(`${BASE}/${id}`);
  },

  createJob(data: JobCreate): Promise<Job> {
    return request(BASE + "/", { method: "POST", body: JSON.stringify(data) });
  },

  updateJob(id: number, data: JobUpdate): Promise<Job> {
    return request(`${BASE}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteJob(id: number): Promise<void> {
    return request(`${BASE}/${id}`, { method: "DELETE" });
  },

  enrich(text: string): Promise<EnrichResult> {
    return request(`${BASE}/enrich`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  },

  scrapeAndEnrich(url: string): Promise<EnrichResult> {
    return request(`${BASE}/scrape?url=${encodeURIComponent(url)}`, {
      method: "POST",
    });
  },
};
