import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only send errors in production
  enabled: process.env.NODE_ENV === "production",

  // Sample 100% of errors
  sampleRate: 1.0,

  // Strip PII
  beforeSend(event) {
    if (event.user) {
      delete event.user.ip_address;
      delete event.user.email;
    }
    return event;
  },
});
