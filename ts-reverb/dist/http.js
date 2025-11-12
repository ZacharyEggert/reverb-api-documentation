import { ReverbApiError } from "./types";
export class HttpClient {
    constructor(opts) {
        this.baseUrl = (opts.baseUrl ?? "https://api.reverb.com/api").replace(/\/$/, "");
        this.token = opts.token;
        this.acceptVersion = opts.acceptVersion ?? "3.0";
        this.acceptLanguage = opts.acceptLanguage ?? "en";
        this.displayCurrency = opts.displayCurrency;
        this.shippingRegion = opts.shippingRegion;
        this.fetchImpl = opts.fetchImpl ?? fetch;
    }
    buildHeaders(extra) {
        const headers = {
            Accept: "application/hal+json",
            "Content-Type": "application/hal+json",
            "Accept-Version": this.acceptVersion,
            "Accept-Language": this.acceptLanguage,
            Authorization: `Bearer ${this.token}`,
        };
        if (this.displayCurrency)
            headers["X-Display-Currency"] = this.displayCurrency;
        if (this.shippingRegion)
            headers["X-Shipping-Region"] = this.shippingRegion;
        if (extra)
            Object.assign(headers, extra);
        return headers;
    }
    buildUrl(path, query) {
        const url = new URL(path.startsWith("http") ? path : `${this.baseUrl}${path.startsWith("/") ? path : "/" + path}`);
        if (query) {
            for (const [k, v] of Object.entries(query)) {
                if (v !== undefined)
                    url.searchParams.set(k, String(v));
            }
        }
        return url.toString();
    }
    async request(method, path, body, options) {
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
            const data = {
                status: res.status,
                message: payload?.message ?? res.statusText,
                errors: payload?.errors,
                raw: payload,
            };
            throw new ReverbApiError(data.message || `HTTP ${res.status}`, res.status, data);
        }
        return payload;
    }
}
