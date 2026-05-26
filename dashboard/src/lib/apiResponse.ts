import { NextResponse } from 'next/server';

export interface ApiErrorPayload {
  success: false;
  error: string;
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiSuccessPayload<T> {
  success: true;
  data: T;
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccessPayload<T>>(
    { success: true, data },
    init
  );
}

export function fail(
  code: string,
  message: string,
  init?: ResponseInit,
  details?: unknown
) {
  const status = init?.status ?? 500;
  const payload: ApiErrorPayload = {
    success: false,
    error: code,
    code,
    message,
    ...(details !== undefined ? { details } : {}),
  };

  return NextResponse.json(payload, { ...init, status });
}
