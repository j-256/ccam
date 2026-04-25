/**
 * Semicolon-delimited role-to-tenant filter string.
 *
 * Format: `ENUM_NAME:realm_type[,realm_type...][;ENUM_NAME2:...]`
 *
 * Tokens before `:` are role `roleEnumName` values (NOT role IDs). Each
 * referenced role must correspond to a role already present in the owning
 * entity's `roles` array; the filter narrows an assigned role to specific
 * tenants, it does not grant the role. Filters referencing a role the
 * entity does not hold are rejected server-side with HTTP 400.
 *
 * Applies to both User and ApiClient resources.
 *
 * @example
 * ```
 * "ECOM_USER:aalm_prd,aalm_s01;LOGCENTER_USER:aamn_*"
 * ```
 */
export type RoleTenantFilterString = string;

/**
 * Parsed view of a {@link RoleTenantFilterString}.
 * Keys are role `roleEnumName` values; values are tenant patterns
 * (e.g. `"aabc_prd"`, `"zxcv_*"`).
 */
export type RoleTenantFilterMap = Record<string, string[]>;
