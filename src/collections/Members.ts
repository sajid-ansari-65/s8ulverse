import type { CollectionConfig } from 'payload'
import { publicRead, contributorUp, editorUp } from '@/lib/access'
import { cleanupMemberRefs } from '@/lib/integrity'

// The central entity — players, creators, coaches, owners. Fields are grouped
// into admin tabs (Profile / Social presence / Career / SEO). Tabs are
// presentational only, so the stored shape is unchanged.
export const Members: CollectionConfig = {
  slug: 'members',
  labels: { singular: 'Member', plural: 'Members' },
  admin: {
    useAsTitle: 'ign',
    group: 'Content',
    defaultColumns: ['ign', 'realName', 'role', 'org', 'isVerified'],
  },
  access: {
    read: publicRead,
    create: contributorUp,
    update: contributorUp,
    delete: editorUp,
  },
  hooks: {
    // Payload has no DB cascade — prune this member's tenures + any stale id
    // refs in Achievements/Brands when the member is deleted.
    afterDelete: [cleanupMemberRefs],
  },
  fields: [
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: {
        description: 'Show on the homepage “Featured roster”.',
        position: 'sidebar',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Profile',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'ign', type: 'text', required: true, label: 'IGN', admin: { width: '50%' } },
                { name: 'realName', type: 'text', admin: { width: '50%' } },
              ],
            },
            { name: 'slug', type: 'text', required: true, unique: true, index: true },
            {
              type: 'row',
              fields: [
                {
                  name: 'role',
                  type: 'select',
                  required: true,
                  admin: { width: '50%', description: 'Current/primary role. Role per stint lives on each Tenure.' },
                  options: [
                    { label: 'Player', value: 'PLAYER' },
                    { label: 'Creator', value: 'CREATOR' },
                    { label: 'Coach', value: 'COACH' },
                    { label: 'Analyst', value: 'ANALYST' },
                    { label: 'Manager', value: 'MANAGER' },
                    { label: 'Owner', value: 'OWNER' },
                  ],
                },
                {
                  name: 'org',
                  type: 'relationship',
                  relationTo: 'organizations',
                  required: true,
                  admin: { width: '50%', description: 'Current/primary org. Full history lives under Affiliations.' },
                },
              ],
            },
            {
              name: 'position',
              type: 'text',
              admin: { description: 'In-game role — e.g. IGL, Fragger, Duelist, Support.' },
            },
            {
              type: 'row',
              fields: [
                { name: 'avatar', type: 'upload', relationTo: 'media', admin: { width: '50%' } },
                { name: 'banner', type: 'upload', relationTo: 'media', admin: { width: '50%' } },
              ],
            },
            { name: 'bio', type: 'textarea' },
            {
              type: 'row',
              fields: [
                { name: 'country', type: 'text', defaultValue: 'IN', admin: { width: '34%' } },
                { name: 'isVerified', type: 'checkbox', defaultValue: false, admin: { width: '33%' } },
                { name: 'isActive', type: 'checkbox', defaultValue: true, admin: { width: '33%' } },
              ],
            },
            { name: 'joinedAt', type: 'date', admin: { description: 'Joined the S8UL FAMILY on… (family-level; per-org dates live on Tenures).' } },
          ],
        },
        {
          label: 'Affiliations',
          description: 'Org history (tenures) + current squads. Tenures power the legacy rosters.',
          fields: [
            {
              name: 'tenures',
              type: 'join',
              collection: 'tenures',
              on: 'member',
              admin: {
                description: 'Each stint at a family org — entry/exit, role, founding. Add a row per org/spell.',
              },
            },
            {
              name: 'teams',
              type: 'relationship',
              relationTo: 'teams',
              hasMany: true,
              admin: { description: 'Current squads (quick display). Historical squads live on each tenure.' },
            },
          ],
        },
        {
          label: 'Social presence',
          description: 'Every platform this person is on — reflected on the public profile.',
          fields: [
            {
              name: 'socials',
              type: 'array',
              labels: { singular: 'Social account', plural: 'Social accounts' },
              admin: { description: 'Add one row per platform. Followers are optional.' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'platform',
                      type: 'select',
                      required: true,
                      admin: { width: '50%' },
                      options: [
                        { label: 'YouTube', value: 'YOUTUBE' },
                        { label: 'Instagram', value: 'INSTAGRAM' },
                        { label: 'X / Twitter', value: 'TWITTER' },
                        { label: 'Twitch', value: 'TWITCH' },
                        { label: 'Facebook', value: 'FACEBOOK' },
                        { label: 'Discord', value: 'DISCORD' },
                        { label: 'TikTok', value: 'TIKTOK' },
                        { label: 'Snapchat', value: 'SNAPCHAT' },
                        { label: 'Website', value: 'WEBSITE' },
                        { label: 'Other', value: 'OTHER' },
                      ],
                    },
                    { name: 'handle', type: 'text', admin: { width: '50%', placeholder: '@username' } },
                  ],
                },
                { name: 'url', type: 'text', required: true, admin: { placeholder: 'https://…' } },
                { name: 'followers', type: 'number', admin: { description: 'Follower / subscriber count.' } },
              ],
            },
          ],
        },
        {
          label: 'Career',
          description: 'Journey from day one — as a player, creator, coach or founder.',
          fields: [
            {
              name: 'career',
              type: 'array',
              label: 'Career history',
              labels: { singular: 'Milestone', plural: 'Milestones' },
              admin: { description: 'List milestones oldest → newest (start to today).' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'year',
                      type: 'text',
                      required: true,
                      admin: { width: '30%', placeholder: 'e.g. 2017' },
                    },
                    { name: 'title', type: 'text', required: true, admin: { width: '70%' } },
                  ],
                },
                { name: 'description', type: 'textarea' },
              ],
            },
          ],
        },
        {
          label: 'Content & feeds',
          description:
            'YouTube stats + videos are pulled automatically. Leave Channels empty to use the YouTube handle from Social presence, or add multiple channels (Main / Shorts / Clips) — each becomes a switchable tab on the profile.',
          fields: [
            {
              name: 'youtubeChannels',
              type: 'array',
              label: 'YouTube channels',
              labels: { singular: 'Channel', plural: 'Channels' },
              admin: {
                description:
                  'Optional. Add one row per channel for creators with more than one (e.g. Main + Shorts). If empty, the YouTube handle in Social presence is used.',
                initCollapsed: false,
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'label',
                      type: 'text',
                      required: true,
                      admin: { width: '40%', placeholder: 'Main / Shorts / Clips' },
                    },
                    {
                      name: 'handle',
                      type: 'text',
                      required: true,
                      admin: { width: '40%', placeholder: '@channelhandle' },
                    },
                    {
                      name: 'primary',
                      type: 'checkbox',
                      admin: { width: '20%', description: 'Shown first.' },
                    },
                  ],
                },
                {
                  name: 'featuredVideo',
                  type: 'text',
                  label: 'Featured video (optional)',
                  admin: {
                    description: 'Video URL or ID to feature for this channel.',
                    placeholder: 'https://youtube.com/watch?v=…',
                  },
                },
              ],
            },
            {
              name: 'featuredYoutubeVideo',
              type: 'text',
              label: 'Featured YouTube video',
              admin: {
                description:
                  'Featured video for the single/primary channel (optional — defaults to the latest upload).',
                placeholder: 'https://youtube.com/watch?v=…',
              },
            },
            {
              name: 'instagramPosts',
              type: 'array',
              label: 'Instagram posts',
              labels: { singular: 'Post', plural: 'Posts' },
              admin: {
                description: 'Paste public Instagram post URLs to embed (e.g. 5–10).',
              },
              fields: [
                {
                  name: 'url',
                  type: 'text',
                  required: true,
                  admin: { placeholder: 'https://www.instagram.com/p/…' },
                },
              ],
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            { name: 'metaTitle', type: 'text' },
            { name: 'metaDesc', type: 'textarea' },
          ],
        },
      ],
    },
  ],
}
