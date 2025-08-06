import { BaseAction, ActionConfigSchema, ActionMetadata, ActionExecutionContext } from '../../types/actions';
import { ComponentFactory } from '../../components/ComponentFactory';
import { ContentInjector } from '../injector';
import { NotificationService } from '../notification';

export class InjectComponentAction extends BaseAction {
  readonly metadata: ActionMetadata = {
    type: 'inject-component',
    label: 'Inject Component',
    icon: '🔧',
    description: 'Add button, input, or text to page'
  };

  getConfigSchema(): ActionConfigSchema {
    return {
      properties: {
        targetSelector: {
          type: 'text',
          label: 'Target Selector',
          placeholder: '.header, #main-content',
          description: 'Where to inject the component',
          defaultValue: 'body'
        },
        componentType: {
          type: 'select',
          label: 'Component Type',
          options: [
            { value: 'button', label: 'Button' },
            { value: 'input', label: 'Input Field' },
            { value: 'text', label: 'Text/Label' }
          ],
          defaultValue: 'button'
        },
        componentText: {
          type: 'text',
          label: 'Component Text',
          placeholder: 'Click me, Enter text, etc.',
          defaultValue: 'Button'
        },
        componentStyle: {
          type: 'textarea',
          label: 'Component Style (CSS)',
          placeholder: 'background: #007bff; color: white; padding: 8px 16px;',
          rows: 3
        }
      }
    };
  }

  getDefaultConfig(): Record<string, any> {
    return {
      targetSelector: 'body',
      componentType: 'button',
      componentText: 'Button',
      componentStyle: ''
    };
  }

  async execute(
    config: Record<string, any>,
    context: ActionExecutionContext,
    nodeId: string
  ): Promise<void> {
    const { targetSelector, componentType, componentText, componentStyle } = config;
    
    const targetElement = document.querySelector(targetSelector || 'body');
    if (!targetElement) {
      NotificationService.showErrorNotification({
        message: 'Target element not found for component injection',
      });
      return;
    }

    // Interpolate variables in component text
    const interpolatedText = context.interpolateVariables(componentText || '');
    
    const componentConfig = {
      componentType,
      componentText: interpolatedText,
      componentStyle,
      targetSelector
    };
    
    // Get workflow ID from context
    const workflowId = context.workflowId || 'default-workflow';
    
    const component = ComponentFactory.create(
      componentConfig,
      workflowId,
      nodeId
    );
    
    ContentInjector.injectMantineComponentInTarget(
      `container-${workflowId}`,
      component,
      targetElement
    );
  }
}