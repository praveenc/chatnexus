// Provider configuration and types

export type ProviderType = 'lmstudio' | 'ollama' | 'bedrock';

export interface ProviderConfig {
  id: ProviderType;
  name: string;
  description: string;
  baseURL: string;
  defaultPort?: number;
  icon: string;
  requiresAuth?: boolean;
}

export const PROVIDERS: Record<ProviderType, ProviderConfig> = {
  lmstudio: {
    id: 'lmstudio',
    name: 'LM Studio',
    description: 'Local models via LM Studio',
    baseURL: 'http://localhost:1234/v1',
    defaultPort: 1234,
    icon: '🚀',
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama',
    description: 'Local models via Ollama',
    baseURL: 'http://localhost:11434/api',
    defaultPort: 11434,
    icon: '🦙',
  },
  bedrock: {
    id: 'bedrock',
    name: 'AWS Bedrock',
    description: 'Cloud models via AWS Bedrock',
    baseURL: 'AWS Bedrock API',
    icon: '☁️',
    requiresAuth: true,
  },
};

export interface ModelInfo {
  key: string;
  name: string;
  size?: string;
  architecture?: string;
  maxContextLength?: number;
  isLoaded?: boolean;
  provider: ProviderType;
}

export interface ModelCount {
  lmstudio: number;
  ollama: number;
  bedrock: number;
}

export interface ProviderSettings {
  provider: ProviderType;
  baseURL?: string;
  temperature?: number;
  maxTokens?: number;
}

// Default settings
export const DEFAULT_SETTINGS: ProviderSettings = {
  provider: 'lmstudio',
  temperature: 0.7,
  maxTokens: 2000,
};
