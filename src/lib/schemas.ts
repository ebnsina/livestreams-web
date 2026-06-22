// Zod schemas for client-side form validation. Each form parses its values
// with safeParse and surfaces fieldErrors() inline before hitting the API.
import { z } from 'zod';

export const email = z.string().trim().min(1, 'Email is required').email('Enter a valid email');
export const password = z.string().min(8, 'Use at least 8 characters');

export const loginSchema = z.object({
	email,
	password: z.string().min(1, 'Password is required')
});

export const registerSchema = z.object({
	name: z.string().trim().min(1, 'Your name is required'),
	orgName: z.string().trim().min(1, 'Organization name is required'),
	email,
	password
});

export const forgotSchema = z.object({ email });

export const resetSchema = z
	.object({
		password,
		confirm: z.string().min(1, 'Confirm your password')
	})
	.refine((v) => v.password === v.confirm, {
		message: "Passwords don't match",
		path: ['confirm']
	});

export const changePasswordSchema = z
	.object({
		current: z.string().min(1, 'Current password is required'),
		next: password,
		confirm: z.string().min(1, 'Confirm your new password')
	})
	.refine((v) => v.next === v.confirm, { message: "Passwords don't match", path: ['confirm'] });

export const createStreamSchema = z.object({
	name: z.string().trim().min(1, 'Name is required').max(120, 'Name is too long')
});

export const inviteSchema = z.object({ email, role: z.string().min(1) });

export const destinationSchema = z.object({
	name: z.string().trim().min(1, 'Name is required'),
	url: z
		.string()
		.trim()
		.min(1, 'RTMP/RTMPS URL is required')
		.regex(/^rtmps?:\/\//i, 'Must start with rtmp:// or rtmps://'),
	streamKey: z.string().trim().min(1, 'Stream key is required')
});

// Map a failed safeParse into a flat { field: message } record for the UI.
export function fieldErrors(err: z.ZodError): Record<string, string> {
	const out: Record<string, string> = {};
	for (const issue of err.issues) {
		const key = String(issue.path[0] ?? '_');
		if (!out[key]) out[key] = issue.message;
	}
	return out;
}
