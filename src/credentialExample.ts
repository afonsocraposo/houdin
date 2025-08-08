import { CredentialRegistry } from './services/credentialRegistry';
import { initializeCredentials } from './services/credentialInitializer';

// Example usage of the credential registry system

// Initialize the credentials (call this on app startup)
initializeCredentials();

const registry = CredentialRegistry.getInstance();

// Example: Get OpenAI authentication
const openaiConfig = {
  apiKey: 'sk-example-key',
  organizationId: 'org-example'
};

try {
  const openaiAuth = registry.getAuth('openai', openaiConfig);
  console.log('OpenAI Auth:', openaiAuth);
  // Result: { apiKey: 'sk-example-key', organizationId: 'org-example' }
} catch (error) {
  console.error('Error getting OpenAI auth:', error);
}

// Example: Get HTTP authentication
const httpConfig = {
  authType: 'bearer',
  token: 'example-bearer-token'
};

try {
  const httpAuth = registry.getAuth('http', httpConfig);
  console.log('HTTP Auth:', httpAuth);
  // Result: { type: 'bearer', headers: { 'Authorization': 'Bearer example-bearer-token' } }
} catch (error) {
  console.error('Error getting HTTP auth:', error);
}

// Example: Get all available credential types
const availableTypes = registry.getAllCredentialMetadata();
console.log('Available credential types:', availableTypes);
// Result: Array of metadata for each credential type

export { registry, initializeCredentials };