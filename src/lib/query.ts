// Centralized query keys for TanStack Query cache consistency.
export const keys = {
	me: ['me'] as const,
	streams: ['streams'] as const,
	stream: (id: string) => ['streams', id] as const,
	sessions: (id: string) => ['streams', id, 'sessions'] as const,
	events: (id: string) => ['streams', id, 'events'] as const,
	jobs: ['jobs'] as const,
	activity: (level?: string) => ['activity', level ?? 'all'] as const,
	assets: ['assets'] as const,
	recordings: (id: string) => ['streams', id, 'recordings'] as const
};
