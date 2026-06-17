import type { CollectionConfig } from 'payload'
import { adminUp, guardUserRole, isAtLeast } from '@/lib/access'

// Admin/editor accounts. Replaces the old Prisma AdminUser + Auth.js — Payload
// handles auth, password hashing, and sessions out of the box.
//
// Access: only owner/admin manage accounts; a user may always read + update
// their own record (e.g. change their password). The `guardUserRole` hook stops
// privilege escalation — granting admin/owner needs an owner, and nobody can
// change their own role.
export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    group: 'Admin',
  },
  // Brute-force throttle (P5): lock an account for 10 min after 5 failed logins.
  auth: {
    maxLoginAttempts: 5,
    lockTime: 600_000,
  },
  access: {
    read: ({ req: { user }, id }) =>
      isAtLeast(user, 'admin') || (user ? user.id === id : false),
    create: adminUp,
    update: ({ req: { user }, id }) =>
      isAtLeast(user, 'admin') || (user ? user.id === id : false),
    delete: adminUp,
  },
  hooks: {
    beforeChange: [guardUserRole],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'editor',
      options: [
        { label: 'Owner', value: 'owner' },
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Contributor', value: 'contributor' },
      ],
    },
  ],
}
