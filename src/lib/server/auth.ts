import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

export const SESSION_COOKIE = 'finn_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

// Secure cookies in production (served over https); off in dev so they work over
// http://localhost. Set and clear use the same value so the clear always matches
// the original and actually deletes it. NOTE: production must be served over https
// (or localhost) — over plain http a browser ignores Secure cookies entirely.
const SECURE_COOKIE = !dev;

function sha256(value: string): Buffer {
	return createHash('sha256').update(value).digest();
}

// HMAC the payload with the env secret. Sessions are stateless: the cookie is
// self-verifying, so AUTH_SECRET must stay stable across restarts or every
// existing cookie is invalidated.
function sign(payload: string): string {
	return createHmac('sha256', env.AUTH_SECRET ?? '')
		.update(payload)
		.digest('hex');
}

// Timing-safe compare against the shared password. Hashing both sides first
// gives timingSafeEqual equal-length inputs and avoids leaking the length.
export function verifyPassword(input: string): boolean {
	if (!env.AUTH_PASSWORD) return false;
	return timingSafeEqual(sha256(input), sha256(env.AUTH_PASSWORD));
}

function sessionValue(): string {
	const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
	return `${expiresAt}.${sign(String(expiresAt))}`;
}

export function verifySessionCookie(value: string | undefined): boolean {
	if (!value) return false;
	const [expiresAtStr, mac] = value.split('.');
	if (!expiresAtStr || !mac) return false;

	const expected = Buffer.from(sign(expiresAtStr));
	const actual = Buffer.from(mac);
	if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false;

	const expiresAt = Number(expiresAtStr);
	return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export function setSessionCookie(cookies: Cookies): void {
	cookies.set(SESSION_COOKIE, sessionValue(), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: SECURE_COOKIE,
		maxAge: MAX_AGE_SECONDS
	});
}

// Mirrors setSessionCookie's attributes (same `secure`) so the browser actually
// deletes the cookie instead of treating it as a different one.
export function clearSessionCookie(cookies: Cookies): void {
	cookies.set(SESSION_COOKIE, '', {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: SECURE_COOKIE,
		maxAge: 0
	});
}
