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
	recordings: (id: string) => ['streams', id, 'recordings'] as const,
	streamDestinations: (id: string) => ['streams', id, 'destinations'] as const,
	webhooks: ['webhooks'] as const,
	webhookDeliveries: ['webhook-deliveries'] as const,
	apiKeys: ['api-keys'] as const,
	oauthProviders: ['oauth-providers'] as const,
	oauthConnections: ['oauth-connections'] as const,
	teamMembers: ['team-members'] as const,
	teamInvitations: ['team-invitations'] as const
};
