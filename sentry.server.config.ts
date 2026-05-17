// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://46531a4b2aae006ef47e6f90c4b7a088@o4511371770658816.ingest.de.sentry.io/4511371853299792",

  // 10% de trazas en server: suficiente para detectar problemas con un
  // grupo de amigos y mucho más barato (sobre todo en pico, donde 100%
  // añadía latencia HTTP por request).
  tracesSampleRate: 0.1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});
