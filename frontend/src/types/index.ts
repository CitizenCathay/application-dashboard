export interface Job {
  id: number;
  company: string;
  role: string;
  location: string | null;
  salary: string | null;
  job_type: string | null;
  deadline: string | null;
  summary: string | null;
  url: string | null;
  notes: string | null;
  status: Status;
  tech_stack: string[];
  created_at: string;
  updated_at: string;
}

export type Status =
  | "Saved"
  | "Applied"
  | "OA"
  | "Interview"
  | "Offer"
  | "Rejected";

export const STATUSES: Status[] = [
  "Saved",
  "Applied",
  "OA",
  "Interview",
  "Offer",
  "Rejected",
];

export interface JobCreate {
  company: string;
  role: string;
  location?: string | null;
  salary?: string | null;
  job_type?: string | null;
  deadline?: string | null;
  summary?: string | null;
  url?: string | null;
  notes?: string | null;
  status?: Status;
  tech_stack?: string[];
}

export interface JobUpdate {
  company?: string;
  role?: string;
  location?: string | null;
  salary?: string | null;
  job_type?: string | null;
  deadline?: string | null;
  summary?: string | null;
  url?: string | null;
  notes?: string | null;
  status?: Status;
  tech_stack?: string[];
}

export interface EnrichResult {
  company: string | null;
  role: string | null;
  location: string | null;
  salary: string | null;
  job_type: string | null;
  deadline: string | null;
  summary: string | null;
  tech_stack: string[];
}