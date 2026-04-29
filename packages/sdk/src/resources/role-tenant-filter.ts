/**
 * Pure helpers for the AM `roleTenantFilter` string.
 *
 * Format: `ENUM_NAME:tenant1,tenant2;ENUM_NAME2:tenant3`
 * - keys are role `roleEnumName` values (NOT role IDs)
 * - values are comma-separated tenant tokens
 *
 * These helpers are intentionally internal to the SDK -- they're consumed by
 * `users.grantRole` / `apiClients.grantRole` to compute the filter string
 * before PUTs. Not exported from the package root.
 */

export function parseFilter(s: string): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  if (!s) return out;
  for (const segment of s.split(';')) {
    if (!segment) continue;
    const colon = segment.indexOf(':');
    if (colon < 0) continue;
    const key = segment.slice(0, colon);
    const tenants = segment.slice(colon + 1).split(',').filter((t) => t.length > 0);
    out.set(key, new Set(tenants));
  }
  return out;
}

export function formatFilter(m: Map<string, Set<string>>): string {
  const parts: string[] = [];
  for (const [key, tenants] of m) {
    parts.push(`${key}:${[...tenants].join(',')}`);
  }
  return parts.join(';');
}

/**
 * Merge (union) new tenants into the filter for a given role.
 *
 * Returns the new filter string and a `changed` flag that is true iff the
 * merge actually added tenants (or created the role entry).
 */
export function mergeTenantsForRole(
  filter: string,
  roleEnumName: string,
  tenantsToAdd: readonly string[],
): { filter: string; changed: boolean } {
  const parsed = parseFilter(filter);
  const existing = parsed.get(roleEnumName);
  const unique = new Set(tenantsToAdd);

  if (existing === undefined) {
    if (unique.size === 0) {
      return { filter, changed: false };
    }
    parsed.set(roleEnumName, unique);
    return { filter: formatFilter(parsed), changed: true };
  }

  let changed = false;
  for (const t of unique) {
    if (!existing.has(t)) {
      existing.add(t);
      changed = true;
    }
  }
  return { filter: changed ? formatFilter(parsed) : filter, changed };
}
