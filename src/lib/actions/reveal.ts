// Scroll-reveal: fade + rise an element in when it enters the viewport.
// Dependency-free (IntersectionObserver) and respects reduced-motion.
export function reveal(node: HTMLElement, opts: { delay?: number; y?: number } = {}) {
	const reduce =
		typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (reduce || typeof IntersectionObserver === 'undefined') return;

	const y = opts.y ?? 14;
	node.style.opacity = '0';
	node.style.transform = `translateY(${y}px)`;
	node.style.transition = 'opacity .6s cubic-bezier(.22,.61,.36,1), transform .6s cubic-bezier(.22,.61,.36,1)';
	if (opts.delay) node.style.transitionDelay = `${opts.delay}ms`;
	node.style.willChange = 'opacity, transform';

	const io = new IntersectionObserver(
		(entries) => {
			for (const e of entries) {
				if (e.isIntersecting) {
					node.style.opacity = '1';
					node.style.transform = 'none';
					io.disconnect();
				}
			}
		},
		{ threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
	);
	io.observe(node);

	return { destroy: () => io.disconnect() };
}
