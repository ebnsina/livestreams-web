import { goto } from '$app/navigation';
import { page } from '$app/state';

// setQuery merges updates into the current URL's query string and navigates
// (replaceState, no scroll, keep focus) so list filters/search/pagination
// persist in the URL and survive reloads / back-forward / sharing. Pass '' or
// null to remove a param.
export function setQuery(updates: Record<string, string | number | null | undefined>) {
	const sp = new URLSearchParams(page.url.searchParams);
	for (const [k, v] of Object.entries(updates)) {
		if (v === '' || v == null) sp.delete(k);
		else sp.set(k, String(v));
	}
	const s = sp.toString();
	goto(s ? `?${s}` : page.url.pathname, {
		replaceState: true,
		keepFocus: true,
		noScroll: true
	});
}
