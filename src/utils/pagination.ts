export interface CursorPaginationParams {
  cursor?: string;
  take?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
}

export function encodeCursor(id: string | bigint | number): string {
  return Buffer.from(id.toString(), 'utf8').toString('base64url');
}

export function decodeCursor(cursor: string): string {
  try {
    return Buffer.from(cursor, 'base64url').toString('utf8');
  } catch {
    return cursor;
  }
}

export function paginateResults<T extends { id: string | bigint }>(
  items: T[],
  limit: number
): PaginatedResult<T> {
  let nextCursor: string | null = null;

  if (items.length > limit) {
    const nextItem = items.pop();
    if (nextItem) {
      nextCursor = encodeCursor(nextItem.id);
    }
  }

  return {
    items,
    nextCursor,
  };
}
