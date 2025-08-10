import {
  BrowserClient,
  defaultStackParser,
  getDefaultIntegrations,
  makeFetchTransport,
  Scope,
} from "@sentry/browser";

export interface SentryInstance {
  client: BrowserClient;
  scope: Scope;
}

/**
 * Creates a Sentry client for content scripts that share window with websites.
 * Uses isolated client approach to avoid global state pollution.
 * Filters errors to only capture extension-related errors.
 */
export function createContentScriptSentryClient(
  environment: string,
): SentryInstance {
  // Filter out integrations that use global state to avoid conflicts
  const integrations = getDefaultIntegrations({}).filter(
    (defaultIntegration) => {
      return !["BrowserApiErrors", "Breadcrumbs", "GlobalHandlers"].includes(
        defaultIntegration.name,
      );
    },
  );

  const client = new BrowserClient({
    dsn: "https://d496c0ad4bb132cb7ecfa1bb78210eaa@o4508275144982528.ingest.de.sentry.io/4509820729294928",
    transport: (options) => {
      console.log(`[Sentry ${environment}] Transport options:`, options);
      const transport = makeFetchTransport(options);

      // Wrap the send method to add logging
      const originalSend = transport.send;
      transport.send = async (request) => {
        console.log(`[Sentry ${environment}] Sending request:`, request);
        try {
          const result = await originalSend.call(transport, request);
          console.log(`[Sentry ${environment}] Transport result:`, result);
          return result;
        } catch (error) {
          console.error(`[Sentry ${environment}] Transport error:`, error);
          throw error;
        }
      };

      return transport;
    },
    stackParser: defaultStackParser,
    integrations: integrations,
    environment,
    debug: true, // Enable debug logging
    beforeSend(event) {
      console.log(`[Sentry ${environment}] Sending event:`, event);
      // Add extension context to all events
      if (event.extra) {
        event.extra.extensionContext = environment;
      } else {
        event.extra = { extensionContext: environment };
      }
      return event;
    },
    beforeSendTransaction(transaction) {
      console.log(`[Sentry ${environment}] Sending transaction:`, transaction);
      return transaction;
    },
  });

  const scope = new Scope();
  scope.setClient(client);

  // Set context tags
  scope.setTag("extension.context", environment);
  scope.setContext("extension", {
    name: "changeme",
    context: environment,
    version: chrome?.runtime?.getManifest?.()?.version || "unknown",
  });

  client.init();

  return {
    client,
    scope,
  };
}

export function captureSentryException(
  instance: SentryInstance,
  error: Error,
  context?: Record<string, any>,
): void {
  if (context) {
    instance.scope.setContext("errorContext", context);
  }
  instance.scope.captureException(error);
}

export function captureSentryMessage(
  instance: SentryInstance,
  message: string,
  level: "debug" | "info" | "warning" | "error" = "info",
  context?: Record<string, any>,
): void {
  if (context) {
    instance.scope.setContext("messageContext", context);
  }
  instance.scope.captureMessage(message, level);
}
