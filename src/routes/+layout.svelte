<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import { theme } from '$lib/theme.svelte';
	import Toaster from '$lib/components/Toaster.svelte';

	let { children } = $props();

	theme.init();

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { staleTime: 10_000, retry: 1, refetchOnWindowFocus: false }
		}
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<QueryClientProvider client={queryClient}>
	{@render children()}
</QueryClientProvider>
<Toaster />
