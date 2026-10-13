/** Role-based permissions for the admin area (spec §10.1). Pure, so it's easy to test. */

export type Role = "admin" | "sales";

export type Permission = "leads:view" | "leads:update" | "leads:export" | "leads:delete" | "audit:view";

const grants: Record<Role, readonly Permission[]> = {
  admin: ["leads:view", "leads:update", "leads:export", "leads:delete", "audit:view"],
  sales: ["leads:view", "leads:update"],
};

export function can(role: Role | null | undefined, permission: Permission): boolean {
  return role ? grants[role].includes(permission) : false;
}
