import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only send errors in production
  enabled: process.env.NODE_ENV === "production",

  sampleRate: 1.0,

  // No session replay — privacy first
  integrations: [],

  // Aggressive PII scrubbing — uunn is a zero-knowledge app, error reports
  // must never contain decrypted content, payloads, or routing data that
  // could deanonymize users or unions.
  beforeSend(event) {
    if (event.user) {
      delete event.user.ip_address;
      delete event.user.email;
      delete event.user.username;
    }
    // Drop request bodies and query params
    if (event.request) {
      delete event.request.data;
      delete event.request.cookies;
      delete event.request.query_string;
      if (event.request.headers) {
        delete event.request.headers.cookie;
        delete event.request.headers.authorization;
      }
    }
    // Drop breadcrumbs entirely — they often capture decrypted state.
    delete event.breadcrumbs;
    // Drop any free-form context which may contain user content.
    delete event.extra;
    delete event.contexts?.state;
    return event;
  },
});
