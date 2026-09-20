import AppError from "../utils/AppError.js";
import { env } from "../config/env.js";

export function notFound(req, res, next) {
  next(new AppError(404, `No route for ${req.method} ${req.originalUrl}`, "NOT_FOUND"));
}

// Every error ends up here and leaves as { message, code, ...details }.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = 500;
  let message = "Something went wrong on the server.";
  let code = "SERVER_ERROR";
  let details;

  if (err instanceof AppError) {
    ({ status, message, code, details } = err);
  } else if (err.name === "ValidationError") {
    status = 400;
    code = "VALIDATION_ERROR";
    message = Object.values(err.errors)[0]?.message ?? "Invalid data.";
  } else if (err.name === "CastError") {
    status = 400;
    code = "INVALID_VALUE";
    message = `Invalid value for ${err.path}.`;
  } else if (err.code === 11000) {
    status = 409;
    code = "DUPLICATE";
    message = "That value is already taken.";
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    code = "BAD_JSON";
    message = "The request body isn't valid JSON.";
  } else if (err.type === "entity.too.large") {
    status = 413;
    code = "TOO_LARGE";
    message = "The request body is too large.";
  }

  if (status === 500) {
    console.error(err);
    if (env.nodeEnv !== "production") message = err.message;
  }

  res.status(status).json({ message, code, ...details });
}
