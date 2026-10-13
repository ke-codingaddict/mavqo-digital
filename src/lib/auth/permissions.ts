/** Role-based permissions for the admin area (spec §10.1). Pure, so it's easy to test. */

export type Role = "admin" | "sales";

export type Permission =
  | "leads:view"
  | "leads:update"
  | "leads:export"
  | "leads:delete"
  | "audit:view"
  | "mail:use"
  | "settings:manage"
  /** See Google Ads dashboards and print reports. */
  | "ads:view"
  /** Add/edit client ad accounts and run syncs. */
  | "ads:manage";

const grants: Record<Role, readonly Permission[]> = {
  admin: ["leads:view", "leads:update", "leads:export", "leads:delete", "audit:view", "mail:use", "settings:manage", "ads:view", "ads:manage"],
  sales: ["leads:view", "leads:update", "mail:use", "ads:view"],
};

export function can(role: Role | null | undefined, permission: Permission): boolean {
  return role ? grants[role].includes(permission) : false;
}
