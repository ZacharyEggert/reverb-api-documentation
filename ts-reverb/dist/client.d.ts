import type { EndListingPayload, ListingCreateUpdatePayload, RefundRequestPayload, ReverbClientOptions, ShipmentPayload } from "./types";
export declare class Reverb {
    private http;
    constructor(opts: ReverbClientOptions);
    getMyAccount(): Promise<unknown>;
    getListing(listingId: string | number): Promise<unknown>;
    createListing(payload: ListingCreateUpdatePayload, opts?: {
        publish?: boolean;
    }): Promise<unknown>;
    updateListing(listingId: string | number, payload: ListingCreateUpdatePayload, opts?: {
        publish?: boolean;
    }): Promise<unknown>;
    endListing(listingId: string | number, payload: EndListingPayload): Promise<unknown>;
    deleteListing(listingId: string | number): Promise<unknown>;
    getListingImages(listingId: string | number): Promise<unknown>;
    reorderImages(listingId: string | number, photos: string[]): Promise<unknown>;
    deleteImage(listingId: string | number, imageId: string | number): Promise<unknown>;
    listDrafts(params?: {
        page?: number;
        per_page?: number;
    }): Promise<unknown>;
    getBumpInfo(listingId: string | number): Promise<unknown>;
    setBumpBid(listingIds: Array<string | number>, bid: number): Promise<unknown>;
    removeBump(listingIds: Array<string | number>): Promise<unknown>;
    addListingsToSale(saleId: string | number, listingIds: Array<string | number>): Promise<unknown>;
    removeListingsFromSale(saleId: string | number, listingIds: Array<string | number>): Promise<unknown>;
    getListingSales(listingId: string | number): Promise<unknown>;
    listSellerSales(): Promise<unknown>;
    listReverbSales(): Promise<unknown>;
    getAutoOffer(listingId: string | number): Promise<unknown>;
    setAutoOffer(listingId: string | number, offer_percentage: number): Promise<unknown>;
    removeAutoOffer(listingId: string | number): Promise<unknown>;
    listOrders(params?: Record<string, string | number | boolean | undefined>): Promise<unknown>;
    createShipment(orderId: string | number, payload: ShipmentPayload): Promise<unknown>;
    listPayments(params?: {
        order_id?: string | number;
    }): Promise<unknown>;
    listPaymentMethods(): Promise<unknown>;
    listPayouts(params?: {
        created_start_date?: string;
        created_end_date?: string;
        per_page?: number;
    }): Promise<unknown>;
    listPayoutLineItems(payoutId: string | number, params?: {
        per_page?: number;
    }): Promise<unknown>;
    enableVacation(): Promise<unknown>;
    disableVacation(): Promise<unknown>;
    getVacationStatus(): Promise<unknown>;
    listConversations(params?: Record<string, string | number | boolean | undefined>): Promise<unknown>;
    listUnreadConversations(): Promise<unknown>;
    getConversation(conversationId: string | number): Promise<unknown>;
    markConversationRead(conversationId: string | number): Promise<unknown>;
    replyToConversation(conversationId: string | number, body: string): Promise<unknown>;
    listFeedbackReceived(): Promise<unknown>;
    listFeedbackSent(): Promise<unknown>;
    leaveBuyerFeedback(orderId: string | number, message: string, rating: number): Promise<unknown>;
    getBuyerFeedback(orderId: string | number): Promise<unknown>;
    listRefundRequests(params?: Record<string, string | number | boolean | undefined>): Promise<unknown>;
    updateRefundRequest(refundRequestId: string | number, payload: RefundRequestPayload): Promise<unknown>;
    createRefundRequestForOrder(orderNumber: string | number, payload: RefundRequestPayload): Promise<unknown>;
    listNegotiations(): Promise<unknown>;
    getNegotiation(offerId: string | number): Promise<unknown>;
    declineOffer(offerId: string | number): Promise<unknown>;
    acceptOffer(offerId: string | number): Promise<unknown>;
    counterOffer(offerId: string | number, amount: number | string, currency: string): Promise<unknown>;
}
export type { ReverbClientOptions } from "./types";
