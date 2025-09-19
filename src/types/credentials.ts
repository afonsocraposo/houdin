import { BaseMetadata, BaseConfigurable } from "./base";

export interface Credential {
  id: string;
  name: string;
  type: string; // Now uses credential type from registry
  description?: string;
  config: Record<string, any>; // Configuration values for this credential
  createdAt: number;
  updatedAt: number;
}

// Credential metadata is the same as base metadata
export type CredentialMetadata = BaseMetadata;

// Abstract base class for all credential types
export abstract class BaseCredential<
  TConfig = Record<string, any>,
  TAuth = Record<string, any>,
> extends BaseConfigurable<TConfig> {
  abstract readonly metadata: CredentialMetadata;

  // Get authentication object from configuration
  abstract getAuth(config: TConfig): TAuth;
}
