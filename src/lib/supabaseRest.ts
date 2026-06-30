import type { GlucoseLevel, NewRecordInput } from "../types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export type AuthSession = {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email?: string;
  };
};

export type CloudRecord = {
  id: string;
  user_id: string;
  stall_id: string;
  stall_name: string;
  food_name: string;
  before: number;
  after1h: number;
  after2h: number;
  delta: number;
  level: GlucoseLevel;
  portion: NewRecordInput["portion"];
  extra_rice: boolean;
  sugary_drink: boolean;
  exercised: boolean;
  note: string;
  shared: boolean;
  anonymous: boolean;
  created_at: string;
};

type AuthResponse = {
  access_token?: string;
  refresh_token?: string;
  user?: {
    id: string;
    email?: string;
  };
  msg?: string;
  error_description?: string;
};

const SESSION_KEY = "canteen-supabase-session";

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getStoredSession(): AuthSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function storeSession(session: AuthSession | null) {
  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function requireConfig() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 还没有配置。请先设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。");
  }
  return { supabaseUrl, supabaseAnonKey };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.msg || body?.error_description || body?.message || "请求失败，请稍后再试";
    throw new Error(message);
  }
  return body as T;
}

function toSession(body: AuthResponse): AuthSession {
  if (!body.access_token || !body.user?.id) {
    throw new Error("登录响应不完整，请检查 Supabase Auth 配置。");
  }
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    user: body.user
  };
}

function getEmailRedirectTo() {
  if (typeof window === "undefined") return undefined;
  return window.location.origin;
}

export async function signUpWithEmail(email: string, password: string) {
  const config = requireConfig();
  const response = await fetch(`${config.supabaseUrl}/auth/v1/signup`, {
    method: "POST",
    headers: {
      apikey: config.supabaseAnonKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password, options: { email_redirect_to: getEmailRedirectTo() } })
  });
  const body = await parseResponse<AuthResponse>(response);
  return body.access_token ? toSession(body) : null;
}

export async function signInWithEmail(email: string, password: string) {
  const config = requireConfig();
  const response = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: config.supabaseAnonKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });
  return toSession(await parseResponse<AuthResponse>(response));
}

export async function fetchMyRecords(session: AuthSession) {
  const config = requireConfig();
  const response = await fetch(`${config.supabaseUrl}/rest/v1/records?select=*&order=created_at.desc`, {
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${session.accessToken}`
    }
  });
  return parseResponse<CloudRecord[]>(response);
}

export async function insertRecord(session: AuthSession, record: Omit<CloudRecord, "id" | "user_id" | "created_at">) {
  const config = requireConfig();
  const response = await fetch(`${config.supabaseUrl}/rest/v1/records`, {
    method: "POST",
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify(record)
  });
  const [created] = await parseResponse<CloudRecord[]>(response);
  return created;
}
