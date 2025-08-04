export interface OpenAIRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
}

export interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class OpenAIService {
  static async callChatCompletion(
    credentialId: string,
    model: string,
    prompt: string,
    maxTokens: number = 150,
    temperature: number = 0.7
  ): Promise<string> {
    try {
      // Send message to background script to make the API call
      const runtime = (typeof browser !== 'undefined' ? browser : chrome) as any;
      
      const response = await new Promise<{success: boolean, data?: string, error?: string}>((resolve) => {
        runtime.runtime.sendMessage({
          type: 'OPENAI_API_CALL',
          data: {
            credentialId,
            model,
            prompt,
            maxTokens,
            temperature
          }
        }, resolve);
      });

      if (!response.success) {
        throw new Error(response.error || 'Unknown error from background script');
      }

      return response.data || '';
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw error;
    }
  }
}