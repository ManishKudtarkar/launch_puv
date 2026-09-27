export const AUTH_COOKIE_TOKEN = "puverse_token";
export const AUTH_COOKIE_ROLE = "puverse_role";

export function setAuthCookie(token: string, role?: string) {
  if (typeof document === "undefined") return;
  // 7 days expiration
  const maxAge = 7 * 24 * 60 * 60;
  document.cookie = `${AUTH_COOKIE_TOKEN}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  if (role) {
    document.cookie = `${AUTH_COOKIE_ROLE}=${encodeURIComponent(role)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  }
}

export function clearAuthCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE_TOKEN}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = `${AUTH_COOKIE_ROLE}=; path=/; max-age=0; SameSite=Lax`;
}
