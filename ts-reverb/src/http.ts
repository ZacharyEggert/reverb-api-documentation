import type { HttpMethod, ReverbClientOptions, RequestOptions, ReverbErrorData } from "./types";
import { ReverbApiError } from "./types";

export class HttpClient {
  private baseUrl: string;
  private token: string;
  private acceptVersion: string;
  private acceptLanguage: string;
  private displayCurrency?: string;
  private shippingRegion?: string;
  private fetchImpl: typeof fetch;

  constructor(opts: ReverbClientOptions) {
    this.baseUrl = (opts.baseUrl ?? "https://api.reverb.com/api").replace(/\/$/, "");
    this.token = opts.token;
    this.acceptVersion = opts.acceptVersion ?? "3.0";
    this.acceptLanguage = opts.acceptLanguage ?? "en";
    this.displayCurrency = opts.displayCurrency;
    this.shippingRegion = opts.shippingRegion;
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  private buildHeaders(extra?: Record<string, string>) {
    const headers: Record<string, string> = {
      Accept: "application/hal+json",
      "Content-Type": "application/hal+json",
      "Accept-Version": this.acceptVersion,
      "Accept-Language": this.acceptLanguage,
      Authorization: `Bearer ${this.token}`,
    };
    if (this.displayCurrency) headers["X-Display-Currency"] = this.displayCurrency;
    if (this.shippingRegion) headers["X-Shipping-Region"] = this.shippingRegion;
    if (extra) Object.assign(headers, extra);
    return headers;
  }

  private buildUrl(path: string, query?: RequestOptions["query"]) {
    const url = new URL(path.startsWith("http") ? path : `${this.baseUrl}${path.startsWith("/") ? path : "/" + path}`);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined) url.searchParams.set(k, String(v));
      }
    }
    return url.toString();
  }

  async request<T = unknown>(method: HttpMethod, path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, options?.query);
    const res = await this.fetchImpl(url, {
      method,
      headers: this.buildHeaders(options?.headers),
      body: body === undefined || method === "GET" ? undefined : JSON.stringify(body),
      signal: options?.signal,
    });

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("json");
    const payload = isJson ? await res.json().catch(() => undefined) : await res.text().catch(() => undefined);

    if (!res.ok) {
      const data: ReverbErrorData = {
        status: res.status,
        message: (payload as any)?.message ?? res.statusText,
        errors: (payload as any)?.errors,
        raw: payload,
      };
      throw new ReverbApiError(data.message || `HTTP ${res.status}`, res.status, data);
    }

    return payload as T;
  }
}
