import { z } from 'zod';

export const streamStatusValues = ['DRAFT', 'SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED'] as const;
export const streamTypeValues = [
  'CODING',
  'LEARNING',
  'DEBUGGING',
  'PROJECT',
  'GAMING',
  'JUST_CHAT',
  'COMMUNITY',
  'SPECIAL_EVENT',
] as const;

export const streamInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum(streamStatusValues).default('SCHEDULED'),
  type: z.enum(streamTypeValues).default('CODING'),
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional().nullable(),
  timezone: z.string().min(1).default('America/Toronto'),
  category: z.string().max(120).optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable().or(z.literal('')),
  twitchUrl: z.string().url().optional().nullable().or(z.literal('')),
  twitchVodUrl: z.string().url().optional().nullable().or(z.literal('')),
  youtubeUrl: z.string().url().optional().nullable().or(z.literal('')),
  episodeNumber: z.coerce.number().int().positive().optional().nullable(),
  githubRepository: z.string().max(300).optional().nullable(),
  githubPullRequest: z.string().max(300).optional().nullable(),
  githubCommit: z.string().max(120).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  seriesId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional().default([]),
});

export type StreamInput = z.infer<typeof streamInputSchema>;
