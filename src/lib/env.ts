import "server-only";
import { z } from "zod";

/**
 * Server-side configuration, validated once (spec §15).
 * Never import this from a Client Component — `server-only` enforces that.
 */
const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
    APP_BASE_URL: z.url(),
    DATABASE_URL: z.string().min(1),
    AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
    IP_HASH_SALT: z.string().min(16, "IP_HASH_SALT must be at least 16 characters"),
    // Encrypts secrets saved from the admin (e.g. the Resend API key). Changing it makes them unreadable.
    SETTINGS_ENCRYPTION_KEY: z.string().min(32, "SETTINGS_ENCRYPTION_KEY must be at least 32 characters"),
    // Number of reverse proxies in front of the app that append to X-Forwarded-For.
    TRUSTED_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(1),

    // Email fallbacks. Normally configured in Admin → Settings; these apply only when nothing is saved there.
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
    LEAD_NOTIFICATION_EMAIL: z.string().optional(),

    // Google Ads reporting. The API version in the URL path (Google releases a new major version roughly quarterly).
    GOOGLE_ADS_API_VERSION: z
      .string()
      .optional()
      .transform((v) => v || "v25")
      .pipe(z.string().regex(/^v\d{2}$/, "should look like v25")),
    // Shared secret the scheduler sends (Vercel Cron sends it as a Bearer token). Sync is off without it.
    CRON_SECRET: z
      .string()
      .optional()
      .transform((v) => v || undefined)
      .pipe(z.string().min(16, "CRON_SECRET must be at least 16 characters").optional()),
  })
  .superRefine((env, ctx) => {
    if (env.APP_ENV === "production" && !env.APP_BASE_URL.startsWith("https://")) {
      ctx.addIssue({ code: "custom", path: ["APP_BASE_URL"], message: "must use https in production" });
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid server configuration:\n${problems}`);
  }
  cached = parsed.data;
  return cached;
}

