export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ModelConfig {
  id: string;
  name: string;
  maxTokens: number;
  description: string;
}

export interface APIResponse {
  choices: {
    message: {
      content: string;
      role: string;
    };
  }[];
  error?: {
    message: string;
  };
}

export enum ModelHost {
  AzureOpenAI = 'AzureOpenAI',
  OpenAI = 'OpenAI'
}
