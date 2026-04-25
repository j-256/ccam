/**
 * Validate an optional `querySize` value for audit-log endpoints.
 *
 * The AM API treats `querySize` as an internal query window and rejects or
 * silently returns 0 records for very large values. We guard against the
 * common misuses: non-positive, non-integer, or obviously out-of-range.
 *
 * @param querySize - The querySize to validate, or undefined.
 * @throws Error when querySize is not a positive integer <= 1000.
 */
export function validateQuerySize(querySize: number | undefined): void {
  if (querySize === undefined) return;
  if (!Number.isInteger(querySize) || querySize <= 0) {
    throw new Error(`querySize must be a positive integer; got ${querySize}`);
  }
  if (querySize > 1000) {
    throw new Error(`querySize must be <= 1000 (AM returns 0 records for very large values); got ${querySize}`);
  }
}
