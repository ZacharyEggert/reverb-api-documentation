export class ReverbApiError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = "ReverbApiError";
        this.status = status;
        this.data = data;
    }
}
