export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface ReverbClientOptions {
  token: string;
  baseUrl?: string; // e.g. https://api.reverb.com/api or https://sandbox.reverb.com/api
  acceptVersion?: string; // default 3.0
  acceptLanguage?: string; // default en
  displayCurrency?: string; // X-Display-Currency
  shippingRegion?: string; // X-Shipping-Region
  fetchImpl?: typeof fetch; // for testing/custom fetch
}

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface ReverbErrorData {
  status: number;
  message?: string;
  errors?: Record<string, unknown>;
  raw?: unknown;
}

export class ReverbApiError extends Error {
  status: number;
  data?: ReverbErrorData;
  constructor(message: string, status: number, data?: ReverbErrorData) {
    super(message);
    this.name = "ReverbApiError";
    this.status = status;
    this.data = data;
  }
}

// Minimal types for common payloads
export interface ListingCreateUpdatePayload {
  make?: string;
  model?: string;
  categories?: Array<{ uuid: string }>;
  condition?: { uuid: string } | string;
  price?: { amount: string | number; currency: string };
  title?: string;
  description?: string;
  sku?: string;
  has_inventory?: boolean;
  inventory?: number;
  offers_enabled?: boolean;
  shipping_profile_id?: string;
  shipping?: { rates?: unknown[] };
  videos?: string[];
  photos?: string[];
  preorder_info?: {
    ship_date?: string; // YYYY-MM-DD
    lead_time?: number;
    lead_time_unit?: "days" | "weeks" | "months";
  };
  publish?: boolean;
  [key: string]: unknown;
}

export interface EndListingPayload {
  reason: "reverb_sale" | "not_sold" | string;
}

export interface ShipmentPayload {
  tracking_number: string;
  carrier: string; // e.g. USPS, UPS, FedEx
  service?: string;
  shipping_label_url?: string;
}

export interface RefundRequestPayload {
  state: "approved" | "conditionally_approved" | "denied";
  reason?:
    | "buyer_return"
    | "lost_shipment"
    | "shipping_damage"
    | "sold_elsewhere"
    | "accidental_order"
    | "change_shipping_address"
    | "shipping_adjustments"
    | string;
  refund_amount?: { amount: string | number; currency: string };
  note_to_buyer?: string;
}

export interface CounterOfferPayload {
  amount: { amount: string | number; currency: string };
}
