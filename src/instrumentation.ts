/**
 * Validates server configuration when the server starts (spec §15), so a
 * missing secret fails loudly at boot instead of on a customer's form submit.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { getServerEnv, isEmailConfigured } = await import("@/lib/env");
  const env = getServerEnv(); // throws with a clear list of problems
  if (!isEmailConfigured(env)) {
    console.warn("[config] Email notifications are not configured — leads will be stored but nobody will be emailed.");
  }
}
