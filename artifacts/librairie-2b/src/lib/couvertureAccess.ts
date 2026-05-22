const COUVERTURE_ALLOWED_EMAILS = new Set([
  'aichabenzangue@gmail.com',
  'lib2b@gmail.com',
])

export function canAccessCouverture(email: string, role: string): boolean {
  const normalizedEmail = email.trim().toLowerCase()
  return COUVERTURE_ALLOWED_EMAILS.has(normalizedEmail) || role === 'couverture'
}

export function mapDbRoleToAppRole(dbRole: string): string {
  if (dbRole === 'admin') return 'gerant'
  if (dbRole === 'couverture') return 'couverture'
  return 'utilisateur'
}
