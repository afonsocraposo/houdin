import { BaseAction, ActionConfigSchema, ActionMetadata, ActionExecutionContext } from '../../types/actions';
import { ModalService } from '../modal';

export class ShowModalAction extends BaseAction {
  readonly metadata: ActionMetadata = {
    type: 'show-modal',
    label: 'Show Modal',
    icon: '💬',
    description: 'Display modal with content'
  };

  getConfigSchema(): ActionConfigSchema {
    return {
      properties: {
        modalTitle: {
          type: 'text',
          label: 'Modal Title',
          placeholder: 'Information, {{node-id}} Data',
          description: 'Title of the modal. Use {{node-id}} to reference action outputs',
          defaultValue: 'Workflow Result'
        },
        modalContent: {
          type: 'textarea',
          label: 'Modal Content',
          placeholder: 'The extracted content is: {{get-content-node}}',
          description: 'Content to display. Use {{node-id}} to reference action outputs',
          rows: 4,
          required: true
        }
      }
    };
  }

  getDefaultConfig(): Record<string, any> {
    return {
      modalTitle: 'Workflow Result',
      modalContent: ''
    };
  }

  async execute(
    config: Record<string, any>,
    context: ActionExecutionContext,
    _nodeId: string
  ): Promise<void> {
    const { modalTitle, modalContent } = config;
    
    const interpolatedTitle = context.interpolateVariables(modalTitle || 'Workflow Result');
    const interpolatedContent = context.interpolateVariables(modalContent || '');

    ModalService.showModal({ 
      title: interpolatedTitle, 
      content: interpolatedContent 
    });
  }
}