import formationData from '../data/formations.generated';
import roleData from '../data/roles.generated';

export type RoleFamily = (typeof formationData.roleFamilies)[number];
export type Formation = (typeof formationData.formations)[number];
export type PlayerRole = (typeof roleData.roles)[number];
export const formations = formationData.formations;
export const roles = roleData.roles;
export const roleFamilies = formationData.roleFamilies;

export function rolesForFamily(family: RoleFamily): readonly PlayerRole[] {
  return roles.filter((role) => (role.compatibleRoleFamilies as readonly RoleFamily[]).includes(family));
}

// null means no role; an unknown ID is never inferred from a similar label.
export function isRoleCompatible(roleId: string | null, family: RoleFamily): boolean {
  return roleId === null || rolesForFamily(family).some((role) => role.id === roleId);
}
