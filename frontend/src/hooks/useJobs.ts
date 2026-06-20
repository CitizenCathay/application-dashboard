import { useState, useEffect, useCallback } from "react";
import type { Job, JobCreate, JobUpdate } from "../types";
import { api } from "../api/client";

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.listJobs();
      setJobs(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const addJob = useCallback(async (data: JobCreate) => {
    const created = await api.createJob(data);
    setJobs((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateJob = useCallback(async (id: number, data: JobUpdate) => {
    const updated = await api.updateJob(id, data);
    setJobs((prev) => prev.map((j) => (j.id === id ? updated : j)));
    return updated;
  }, []);

  const deleteJob = useCallback(async (id: number) => {
    await api.deleteJob(id);
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }, []);

  return { jobs, loading, error, addJob, updateJob, deleteJob, refetch: fetchJobs };
}