/**
 * Badge component for user roles.
 * Renders admin | user | owner with distinct colour coding.
 */
const roleMap = {
  admin: { label: 'Admin', cls: 'badge-admin' },
  user: { label: 'User', cls: 'badge-user' },
  owner: { label: 'Owner', cls: 'badge-owner' },
};

export function Badge({ role }) {
  const cfg = roleMap[role] || { label: role ?? '—', cls: 'badge-user' };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}
