// Vishwas AI API client
const STORAGE_KEY = "vishwas_token";
const BASE_KEY = "vishwas_api_base";
const DEFAULT_API =
  import.meta.env.VITE_API_BASE ||
  "http://127.0.0.1:8000";

export const getApiBase = (): string => {
  if (typeof window === "undefined") return DEFAULT_API;

  return localStorage.getItem(BASE_KEY) || DEFAULT_API;
};
export const setApiBase = (url: string) => {
  if (typeof window !== "undefined") localStorage.setItem(BASE_KEY, url);
};

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
};
export const setToken = (t: string | null) => {
  if (typeof window === "undefined") return;
  if (t) localStorage.setItem(STORAGE_KEY, t);
  else localStorage.removeItem(STORAGE_KEY);
};

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(
  path: string,
  opts: {
    method?: string;
    body?: unknown;
    auth?: boolean;
    query?: Record<string, string | number | boolean | undefined>;
  } = {},
): Promise<T> {
  const { method = "GET", body, auth = true, query } = opts;
  const url = new URL(path, getApiBase());
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== "" && v !== null) url.searchParams.set(k, String(v));
    }
  }
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new ApiError(0, `Network error reaching ${url.toString()}. Is the backend running?`);
  }
  const text = await res.text();
  const data = text
    ? (() => {
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      })()
    : null;
  if (!res.ok) {
    const msg =
      (data &&
      typeof data === "object" &&
      "detail" in data &&
      typeof (data as any).detail === "string"
        ? (data as any).detail
        : res.statusText) || "Request failed";
    if (res.status === 401) setToken(null);
    throw new ApiError(res.status, msg, data);
  }
  return data as T;
}

// ===== Auth =====
export const api = {
  health: () => request<{ status: string }>("/health", { auth: false }),
  login: (username: string, password: string) =>
    request<{ access_token: string; token_type: string }>("/auth/login", {
      method: "POST",
      auth: false,
      body: { username, password },
    }),
  me: () => request<User>("/auth/me"),
  signup: (username: string, password: string, role = "credit_officer", linked_msme_id?: number) =>
    request<unknown>("/auth/register", {
      method: "POST",
      auth: false,
      body: { username, password, role, linked_msme_id },
    }),

  // Demo
  seed: (count = 18) => request<any>(`/demo/seed`, { method: "POST", query: { count } }),
  reset: () => request<any>("/demo/reset", { method: "DELETE" }),

  // MSME
  onboardMsme: (p: MsmeCreate) => request<Msme>("/msme/onboard", { method: "POST", body: p }),
  listMsmes: (
    q: {
      limit?: number;
      offset?: number;
      sector?: string;
      state?: string;
      credit_invisible?: boolean;
    } = {},
  ) =>
    request<{ total: number; limit: number; offset: number; items: Msme[] }>("/msme/", {
      query: q as any,
    }),
  getMsme: (id: number) => request<Msme>(`/msme/${id}`),
  updateMsme: (id: number, patch: Partial<Msme>) =>
    request<Msme>(`/msme/${id}`, { method: "PUT", body: patch }),

  // Data ingestion
  addGst: (id: number, p: any) => request<any>(`/data/gst/${id}`, { method: "POST", body: p }),
  addUpi: (id: number, p: any) => request<any>(`/data/upi/${id}`, { method: "POST", body: p }),
  addEpfo: (id: number, p: any) => request<any>(`/data/epfo/${id}`, { method: "POST", body: p }),
  addBank: (id: number, p: any) =>
    request<any>(`/data/bank-statement/${id}`, { method: "POST", body: p }),
  addNote: (id: number, free_text: string) =>
    request<any>(`/data/unstructured/${id}`, { method: "POST", body: { free_text } }),

  // Score
  computeScore: (id: number) => request<any>(`/score/compute/${id}`, { method: "POST" }),
  getCard: (id: number) => request<HealthCard>(`/score/${id}/card`),
  getHistory: (id: number) => request<any>(`/score/${id}/history`),

  // Insights
  summary: (id: number) => request<InsightResponse>(`/insights/${id}/summary`),
  ask: (id: number, question: string) =>
    request<InsightResponse>(`/insights/${id}/ask`, { method: "POST", body: { question } }),
  whatIf: (id: number, change_description: string) =>
    request<InsightResponse>(`/insights/${id}/what-if`, {
      method: "POST",
      body: { change_description, assumptions: {} },
    }),
  anomalies: (id: number) => request<InsightResponse[]>(`/insights/${id}/anomalies`),

  // AA
  aaRequest: (p: { msme_id: number; fip_name: string; purpose: string; expires_at: string }) =>
    request<any>("/aa/consent/request", { method: "POST", body: p }),
  aaApprove: (consent_id: string) =>
    request<any>(`/aa/consent/${consent_id}/approve`, { method: "POST" }),
  aaRevoke: (consent_id: string) =>
    request<any>(`/aa/consent/${consent_id}/revoke`, { method: "POST" }),
  aaStatus: (consent_id: string) => request<any>(`/aa/consent/${consent_id}/status`),

  // Credit
  eligibility: (p: { msme_id: number; loan_type: string; requested_amount: string }) =>
    request<any>("/credit/eligibility-check", { method: "POST", body: p }),
  portfolioSummary: () => request<PortfolioSummary>("/credit/portfolio-summary"),
  benchmark: (id: number) => request<any>(`/credit/benchmark/${id}`),

  // ULI / OCEN
  uliApply: (p: { msme_id: number; loan_type: string; requested_amount: string }) =>
    request<any>("/uli/loan-application", { method: "POST", body: p }),
  uliStatus: (id: string) => request<any>(`/uli/loan-application/${id}/status`),
  ocenAssess: (p: { msme_id: number; loan_type: string; requested_amount: string }) =>
    request<any>("/ocen/credit-assessment", { method: "POST", body: p }),

  // Alerts
  alerts: () => request<Alert[]>("/alerts/"),
  msmeAlerts: (id: number) => request<Alert[]>(`/alerts/${id}`),
  ackAlert: (id: number) => request<any>(`/alerts/${id}/acknowledge`, { method: "POST" }),
};

// ===== Types =====
export interface Msme {
  id: number;
  business_name: string;
  owner_name: string;
  udyam_number: string | null;
  sector: string;
  sub_sector?: string | null;
  city?: string;
  state?: string;
  registration_date?: string;
  employee_count?: number;
  requested_credit_invisible_flag?: boolean;
}

export interface MsmeCreate {
  business_name: string;
  owner_name: string;
  udyam_number?: string | null;
  sector: string;
  sub_sector?: string | null;
  city: string;
  state: string;
  registration_date?: string | null;
  employee_count: number;
  requested_credit_invisible_flag: boolean;
}

export interface User {
  id: number;
  username: string;
  role: "admin" | "credit_officer" | "msme_owner";
  linked_msme_id: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface HealthCard {
  msme_id: number;
  business_name: string;
  overall_score: string;
  grade: string;
  risk_band: string;
  confidence_score: string;
  data_quality: string;
  dimensions: { name: string; score: string; weight: string }[];
  score_trend: { month: string; score: string }[];
  top_strengths: string[];
  top_risks: string[];
  ml_predicted_band: string;
  ml_rule_divergence_flag: boolean;
  recommended_next_data_source: string | null;
}

export interface PortfolioSummary {
  score_distribution: Record<string, number>;
  risk_band_counts: Record<string, number>;
  sector_average_scores: Record<string, string>;
  newly_scoreable_ntc_ntb_count: number;
}

export interface InsightResponse {
  msme_id: number;
  insight_type: string;
  content_text: string;
  generated_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Alert {
  id: number;
  msme_id: number;
  triggered_at: string;
  alert_type: string;
  severity: string;
  message: string;
  acknowledged: boolean;
}
