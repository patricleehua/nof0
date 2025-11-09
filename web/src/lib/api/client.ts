export const BASE_URL =
  process.env.NEXT_PUBLIC_NOF1_API_BASE_URL || "https://nof1.ai/api";

type ApiEnvelope<T> = {
  requestId?: string | null;
  success?: boolean | null;
  message?: string | null;
  errorCode?: string | number | null;
  data?: T;
};

function isEnvelope<T>(payload: unknown): payload is ApiEnvelope<T> {
  if (!payload || typeof payload !== "object") return false;
  if (!("data" in payload)) return false;
  return (
    "success" in payload ||
    "requestId" in payload ||
    "message" in payload ||
    "errorCode" in payload
  );
}

function unwrapEnvelope<T>(payload: unknown): T {
  if (!isEnvelope<T>(payload)) return payload as T;

  if (payload.success === false) {
    const code = payload.errorCode ? ` (${payload.errorCode})` : "";
    const message = payload.message ?? `Request marked unsuccessful${code}`;
    throw new Error(message);
  }

  return (payload.data ?? null) as T;
}

export async function fetcher<T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    // Allow the browser HTTP cache to satisfy short‑interval polling.
    // Combined with Cache-Control from our proxy, this avoids hitting Vercel at all
    // when data is fresh, dramatically reducing Fast Data Transfer.
    cache: init?.cache ?? "default",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed ${res.status}: ${text || res.statusText}`);
  }
  const payload = await res.json();
  return unwrapEnvelope<T>(payload);
}

export const apiUrl = (path: string) => `${BASE_URL}${path}`;
