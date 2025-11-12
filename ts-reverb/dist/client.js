import { HttpClient } from "./http";
export class Reverb {
    constructor(opts) {
        this.http = new HttpClient(opts);
    }
    // 22 Account Details
    getMyAccount() {
        return this.http.request("GET", "/my/account");
    }
    // Get a single listing
    getListing(listingId) {
        return this.http.request("GET", `/listings/${listingId}`);
    }
    // 7 Creating and Updating Listings
    createListing(payload, opts) {
        return this.http.request("POST", "/listings", payload, {
            query: opts?.publish ? { publish: true } : undefined,
        });
    }
    updateListing(listingId, payload, opts) {
        return this.http.request("PUT", `/listings/${listingId}`, payload, {
            query: opts?.publish ? { publish: true } : undefined,
        });
    }
    endListing(listingId, payload) {
        return this.http.request("PUT", `/my/listings/${listingId}/state/end`, payload);
    }
    deleteListing(listingId) {
        return this.http.request("DELETE", `/listings/${listingId}`);
    }
    // 8 Image Updating
    getListingImages(listingId) {
        return this.http.request("GET", `/listings/${listingId}/images/`);
    }
    // Reorder/override positions by sending photos array on listing update
    reorderImages(listingId, photos) {
        return this.updateListing(listingId, { photos, photo_upload_method: "override_position" });
    }
    deleteImage(listingId, imageId) {
        return this.http.request("DELETE", `/api/listings/${listingId}/images/${imageId}`);
    }
    // 9 Managing Drafts
    listDrafts(params) {
        return this.http.request("GET", "/my/listings/drafts", undefined, { query: params });
    }
    // 10 Manage Bumps
    getBumpInfo(listingId) {
        return this.http.request("GET", `/listings/${listingId}/bump`);
    }
    setBumpBid(listingIds, bid) {
        return this.http.request("PUT", "/bump/v2/bids", { products: listingIds, bid });
    }
    removeBump(listingIds) {
        return this.http.request("DELETE", "/bump/v2/bids", { products: listingIds });
    }
    // 11 Manage Sales
    addListingsToSale(saleId, listingIds) {
        return this.http.request("POST", `/sales/${saleId}/listings`, { listing_ids: listingIds });
    }
    removeListingsFromSale(saleId, listingIds) {
        return this.http.request("DELETE", `/api/sales/${saleId}/listings`, { listing_ids: listingIds });
    }
    getListingSales(listingId) {
        return this.http.request("GET", `/api/listings/${listingId}/sales`);
    }
    listSellerSales() {
        return this.http.request("GET", "/sales/seller");
    }
    listReverbSales() {
        return this.http.request("GET", "/sales/reverb");
    }
    // 12 Manage Direct Offers
    getAutoOffer(listingId) {
        return this.http.request("GET", `/api/listings/${listingId}/auto_offer`);
    }
    setAutoOffer(listingId, offer_percentage) {
        return this.http.request("POST", `/api/listings/${listingId}/auto_offer`, { offer_percentage });
    }
    removeAutoOffer(listingId) {
        return this.http.request("DELETE", `/api/listings/${listingId}/auto_offer`);
    }
    // 13 Retrieve Orders
    listOrders(params) {
        return this.http.request("GET", "/my/orders/selling/all", undefined, { query: params });
    }
    // 14 Ship Orders
    createShipment(orderId, payload) {
        return this.http.request("POST", `/api/orders/${orderId}/shipments`, payload);
    }
    // 15 Tying Orders Together - handled via data (order_bundle_id)
    // 19 Payments and PayPal Transactions
    listPayments(params) {
        return this.http.request("GET", "/my/payments/selling", undefined, { query: params });
    }
    listPaymentMethods() {
        return this.http.request("GET", "/payment_methods");
    }
    // 20 Read Payouts
    listPayouts(params) {
        return this.http.request("GET", "/my/payouts", undefined, { query: params });
    }
    listPayoutLineItems(payoutId, params) {
        return this.http.request("GET", `/api/my/payouts/${payoutId}/line_items`, undefined, { query: params });
    }
    // 21 Vacation Mode
    enableVacation() {
        return this.http.request("POST", "/shop/vacation");
    }
    disableVacation() {
        return this.http.request("DELETE", "/shop/vacation");
    }
    getVacationStatus() {
        return this.http.request("GET", "/shop/vacation");
    }
    // 23 Manage Messages
    listConversations(params) {
        return this.http.request("GET", "/my/conversations", undefined, { query: params });
    }
    listUnreadConversations() {
        return this.listConversations({ unread_only: true });
    }
    getConversation(conversationId) {
        return this.http.request("GET", `/api/my/conversations/${conversationId}`);
    }
    markConversationRead(conversationId) {
        return this.http.request("PUT", `/api/my/conversations/${conversationId}`, { read: true });
    }
    replyToConversation(conversationId, body) {
        return this.http.request("POST", `/api/my/conversations/${conversationId}/messages`, { body });
    }
    // 24 Manage Feedback
    listFeedbackReceived() {
        return this.http.request("GET", "/my/feedback/received");
    }
    listFeedbackSent() {
        return this.http.request("GET", "/my/feedback/sent");
    }
    leaveBuyerFeedback(orderId, message, rating) {
        return this.http.request("POST", `/api/orders/${orderId}/feedback/buyer`, { message, rating });
    }
    getBuyerFeedback(orderId) {
        return this.http.request("GET", `/api/orders/${orderId}/feedback/buyer`);
    }
    // 17 Manage Refund Requests
    listRefundRequests(params) {
        return this.http.request("GET", "/my/refund_requests/selling", undefined, { query: params });
    }
    updateRefundRequest(refundRequestId, payload) {
        return this.http.request("PUT", `/api/my/refund_requests/selling/${refundRequestId}`, payload);
    }
    createRefundRequestForOrder(orderNumber, payload) {
        return this.http.request("POST", `/api/my/orders/selling/${orderNumber}/refund_requests`, payload);
    }
    // 18 Manage Negotiations
    listNegotiations() {
        return this.http.request("GET", "/my/listings/negotiations");
    }
    getNegotiation(offerId) {
        return this.http.request("GET", `/api/my/negotiations/${offerId}`);
    }
    declineOffer(offerId) {
        return this.http.request("POST", `/api/my/negotiations/${offerId}/decline`);
    }
    acceptOffer(offerId) {
        return this.http.request("POST", `/api/my/negotiations/${offerId}/accept`);
    }
    counterOffer(offerId, amount, currency) {
        const payload = { amount: { amount, currency } };
        return this.http.request("POST", `/api/my/negotiations/${offerId}/counter`, payload);
    }
}
