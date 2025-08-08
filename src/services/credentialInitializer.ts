import { CredentialRegistry } from './credentialRegistry';
import { OpenAICredential } from './credentials/openaiCredential';
import { HTTPCredential } from './credentials/httpCredential';
import { SecretCredential } from './credentials/secretCredential';

export function initializeCredentials(): void {
  const registry = CredentialRegistry.getInstance();

  // Register all credential types
  registry.register(new OpenAICredential());
  registry.register(new HTTPCredential());
  registry.register(new SecretCredential());
}