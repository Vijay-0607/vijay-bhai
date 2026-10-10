import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function successResponse<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: PaginationMeta
) {
  const body: Record<string, unknown> = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

export function errorResponse(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  fields?: Record<string, string>
) {
  const body: Record<string, unknown> = {
    success: false,
    error: { code, message },
  };
  if (fields) (body.error as Record<string, unknown>).fields = fields;
  return res.status(statusCode).json(body);
}

export function parsePagination(query: Record<string, unknown>): { page: number; pageSize: number; skip: number } {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(String(query.pageSize ?? '20'), 10) || 20));
  return { page, pageSize, skip: (page - 1) * pageSize };
}

export function buildMeta(page: number, pageSize: number, total: number): PaginationMeta {
  return { page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}
