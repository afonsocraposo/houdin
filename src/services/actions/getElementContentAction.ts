import { BaseAction, ActionConfigSchema, ActionMetadata, ActionExecutionContext } from '../../types/actions';
import { NotificationService } from '../notification';

export class GetElementContentAction extends BaseAction {
  readonly metadata: ActionMetadata = {
    type: 'get-element-content',
    label: 'Get Element Content',
    icon: '📖',
    description: 'Extract text content from page element'
  };

  getConfigSchema(): ActionConfigSchema {
    return {
      properties: {
        elementSelector: {
          type: 'text',
          label: 'Element Selector',
          placeholder: '.title, #content, h1',
          description: 'CSS selector for the element to extract content from',
          required: true,
          defaultValue: 'h1'
        }
      }
    };
  }

  getDefaultConfig(): Record<string, any> {
    return {
      elementSelector: 'h1'
    };
  }

  async execute(
    config: Record<string, any>,
    context: ActionExecutionContext,
    nodeId: string
  ): Promise<void> {
    const { elementSelector } = config;
    
    const element = document.querySelector(elementSelector);
    if (element) {
      const textContent = element.textContent || '';
      // Store the output in the execution context
      context.setOutput(nodeId, textContent);
    } else {
      NotificationService.showErrorNotification({
        message: 'Element not found for content extraction',
      });
      context.setOutput(nodeId, '');
    }
  }
}