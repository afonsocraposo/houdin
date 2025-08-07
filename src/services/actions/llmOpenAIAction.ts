import { BaseAction, ActionConfigSchema, ActionMetadata, ActionExecutionContext } from '../../types/actions';
import { OpenAIService } from '../openai';
import { NotificationService } from '../notification';

interface LLMOpenAIActionConfig {
  credentialId: string;
  model: string;
  prompt: string;
  maxTokens: number;
  temperature: number;
}

export class LLMOpenAIAction extends BaseAction<LLMOpenAIActionConfig> {
  readonly metadata: ActionMetadata = {
    type: 'llm-openai',
    label: 'LLM OpenAI',
    icon: '🤖',
    description: 'Send prompt to OpenAI and get response',
    completion: true
  };

  getConfigSchema(): ActionConfigSchema {
    return {
      properties: {
        credentialId: {
          type: 'credentials',
          service: 'openai',
          label: 'OpenAI Credential',
          placeholder: 'Select an OpenAI API key',
          description: 'Choose the OpenAI API credential to use',
          required: true
        },
        model: {
          type: 'select',
          label: 'Model',
          options: [
            { label: 'GPT-4o (Omni)', value: 'gpt-4o' },
            { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
            { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
            { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
            { label: 'GPT-3.5 Turbo (16k)', value: 'gpt-3.5-turbo-16k' }
          ],
          defaultValue: 'gpt-3.5-turbo'
        },
        prompt: {
          type: 'textarea',
          label: 'Prompt',
          placeholder: 'You are a helpful assistant. User input: {{get-content-node}}',
          description: 'Use {{node-id}} to reference outputs from other actions',
          rows: 4,
          required: true
        },
        maxTokens: {
          type: 'number',
          label: 'Max Tokens',
          placeholder: '150',
          description: 'Maximum number of tokens to generate',
          min: 1,
          max: 4000,
          defaultValue: 150
        },
        temperature: {
          type: 'number',
          label: 'Temperature',
          placeholder: '0.7',
          description: 'Controls randomness (0 = deterministic, 1 = creative)',
          min: 0,
          max: 1,
          step: 0.1,
          defaultValue: 0.7
        }
      }
    };
  }

  getDefaultConfig(): LLMOpenAIActionConfig {
    return {
      credentialId: '',
      model: 'gpt-3.5-turbo',
      prompt: '',
      maxTokens: 150,
      temperature: 0.7
    };
  }

  async execute(
    config: LLMOpenAIActionConfig,
    context: ActionExecutionContext,
    nodeId: string
  ): Promise<void> {
    const { credentialId, model, prompt, maxTokens, temperature } = config;

    if (!credentialId) {
      NotificationService.showErrorNotification({
        message: 'No OpenAI credential selected',
      });
      return;
    }

    if (!prompt) {
      NotificationService.showErrorNotification({
        message: 'No prompt provided for OpenAI',
      });
      return;
    }

    try {
      // Interpolate variables in the prompt
      const interpolatedPrompt = context.interpolateVariables(prompt);

      // Show loading notification
      NotificationService.showNotification({
        title: 'Calling OpenAI API...',
      });

      // Call OpenAI API
      const response = await OpenAIService.callChatCompletion(
        credentialId,
        model || 'gpt-3.5-turbo',
        interpolatedPrompt,
        maxTokens || 150,
        temperature || 0.7,
      );

      // Store the response in the execution context
      context.setOutput(nodeId, response);
    } catch (error) {
      console.error('Error executing OpenAI action:', error);
      NotificationService.showErrorNotification({
        message: `OpenAI API error: ${error}`,
      });
      // Store empty response on error
      context.setOutput(nodeId, '');
    }
  }
}