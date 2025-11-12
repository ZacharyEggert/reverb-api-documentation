import type { HttpMethod, ReverbClientOptions, RequestOptions } from "./types";
export declare class HttpClient {
    private baseUrl;
    private token;
    private acceptVersion;
    private acceptLanguage;
    private displayCurrency?;
    private shippingRegion?;
    private fetchImpl;
    constructor(opts: ReverbClientOptions);
    private buildHeaders;
    private buildUrl;
    request<T = unknown>(method: HttpMethod, path: string, body?: unknown, options?: RequestOptions): Promise<T>;
}
