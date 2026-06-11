import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function err(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { success: false, error: message, ...(details ? { details } : {}) },
    { status }
  );
}

export function validationError(error: ZodError) {
  return NextResponse.json(
    {
      success: false,
      error: "Validation failed",
      details: error.flatten().fieldErrors,
    },
    { status: 422 }
  );
}

export function unauthorized() {
  return err("Unauthorized", 401);
}

export function forbidden() {
  return err("Forbidden", 403);
}

export function notFound(resource = "Resource") {
  return err(`${resource} not found`, 404);
}

export function serverError() {
  return err("Internal server error", 500);
}

export function tooManyRequests(resetAt: Date) {
  return NextResponse.json(
    { success: false, error: "Too many requests", resetAt: resetAt.toISOString() },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((resetAt.getTime() - Date.now()) / 1000)),
      },
    }
  );
}
