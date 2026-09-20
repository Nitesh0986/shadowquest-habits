// An error we throw on purpose. The error handler turns it into a clean JSON response.
export default class AppError extends Error {
  constructor(status, message, code = "ERROR", details = undefined) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
