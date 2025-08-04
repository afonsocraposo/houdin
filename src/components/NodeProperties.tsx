import React, { useEffect, useState } from 'react';
import { Stack, TextInput, Select, Textarea, Text, Card, Group, NumberInput } from '@mantine/core';
import { WorkflowNode, TriggerNodeData, ActionNodeData, ConditionNodeData } from '../types/workflow';
import { Credential } from '../types/credentials';
import { StorageManager } from '../services/storage';

interface NodePropertiesProps {
  node: WorkflowNode | null;
  onNodeUpdate: (updatedNode: WorkflowNode) => void;
}

export const NodeProperties: React.FC<NodePropertiesProps> = ({ node, onNodeUpdate }) => {
  const [openaiCredentials, setOpenaiCredentials] = useState<Credential[]>([]);
  const storageManager = StorageManager.getInstance();

  // Load OpenAI credentials
  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const openaiCreds = await storageManager.getCredentialsByService('openai');
        setOpenaiCredentials(openaiCreds);
      } catch (error) {
        console.error('Failed to load OpenAI credentials:', error);
      }
    };

    loadCredentials();
  }, []);

  // Ensure default values are set for action nodes
  useEffect(() => {
    if (node && node.type === 'action') {
      const actionData = node.data as ActionNodeData;
      let needsUpdate = false;
      const updatedConfig = { ...actionData.config };

      if (actionData.actionType === 'inject-component') {
        // Set default componentType if missing
        if (!updatedConfig.componentType) {
          updatedConfig.componentType = 'button';
          needsUpdate = true;
        }

        // Set default componentText if missing
        if (!updatedConfig.componentText) {
          updatedConfig.componentText = 'Button';
          needsUpdate = true;
        }

        // Set default targetSelector if missing
        if (!updatedConfig.targetSelector) {
          updatedConfig.targetSelector = 'body';
          needsUpdate = true;
        }
      } else if (actionData.actionType === 'get-element-content') {
        // Set default elementSelector if missing
        if (!updatedConfig.elementSelector) {
          updatedConfig.elementSelector = 'h1';
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        const updatedNode = {
          ...node,
          data: {
            ...node.data,
            config: updatedConfig
          }
        };
        onNodeUpdate(updatedNode);
      }
    }
  }, [node, onNodeUpdate]);

  if (!node) {
    return (
      <Card withBorder p="md" style={{ minHeight: '300px' }}>
        <Text c="dimmed" ta="center" mt="xl">
          Select a node to edit its properties
        </Text>
      </Card>
    );
  }

  const updateNodeData = (path: string, value: any) => {
    const pathParts = path.split('.');
    const updatedNode = { ...node };
    
    let current = updatedNode.data;
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) {
        current[pathParts[i]] = {};
      }
      current = current[pathParts[i]];
    }
    current[pathParts[pathParts.length - 1]] = value;
    
    onNodeUpdate(updatedNode);
  };

  const renderTriggerProperties = (data: TriggerNodeData) => {
    switch (data.triggerType) {
      case 'component-load':
        return (
          <TextInput
            label="Element Selector"
            placeholder=".button, #submit"
            description="CSS selector for the element"
            value={data.config.selector || ''}
            onChange={(e) => updateNodeData('config.selector', e.target.value)}
          />
        );
      
      case 'delay':
        return (
          <TextInput
            label="Delay (milliseconds)"
            placeholder="1000"
            description="Delay in milliseconds"
            value={data.config.delay?.toString() || ''}
            onChange={(e) => updateNodeData('config.delay', parseInt(e.target.value) || 0)}
          />
        );
      
      case 'page-load':
        return (
          <Text size="sm" c="dimmed">
            This trigger activates when the page loads. No configuration needed.
          </Text>
        );
      
      default:
        return null;
    }
  };

  const renderActionProperties = (data: ActionNodeData) => {
    switch (data.actionType) {
      case 'inject-component':
        return (
          <Stack gap="md">
            <TextInput
              label="Target Selector"
              placeholder=".header, #main-content"
              description="Where to inject the component"
              value={data.config.targetSelector || ''}
              onChange={(e) => updateNodeData('config.targetSelector', e.target.value)}
            />
            
            <Select
              label="Component Type"
              data={[
                { value: 'button', label: 'Button' },
                { value: 'input', label: 'Input Field' },
                { value: 'text', label: 'Text/Label' }
              ]}
              value={data.config.componentType || 'button'}
              onChange={(value) => updateNodeData('config.componentType', value)}
            />
            
            <TextInput
              label="Component Text"
              placeholder="Click me, Enter text, etc."
              value={data.config.componentText || ''}
              onChange={(e) => updateNodeData('config.componentText', e.target.value)}
            />
            
            <Textarea
              label="Component Style (CSS)"
              placeholder="background: #007bff; color: white; padding: 8px 16px;"
              rows={3}
              value={data.config.componentStyle || ''}
              onChange={(e) => updateNodeData('config.componentStyle', e.target.value)}  
            />
          </Stack>
        );
      
      case 'get-element-content':
        return (
          <TextInput
            label="Element Selector"
            placeholder=".title, #content, h1"
            description="CSS selector for the element to extract content from"
            value={data.config.elementSelector || ''}
            onChange={(e) => updateNodeData('config.elementSelector', e.target.value)}
          />
        );
      
      case 'copy-content':
        return (
          <TextInput
            label="Source Selector"
            placeholder=".content, #description"
            description="Element to copy content from"
            value={data.config.sourceSelector || ''}
            onChange={(e) => updateNodeData('config.sourceSelector', e.target.value)}
          />
        );
      
       case 'show-modal':
         return (
           <Stack gap="md">
             <TextInput
               label="Modal Title"
               placeholder="Information, {{node-id}} Data"
               description="Title of the modal. Use {{node-id}} to reference action outputs"
               value={data.config.modalTitle || ''}
               onChange={(e) => updateNodeData('config.modalTitle', e.target.value)}
             />
             
             <Textarea
               label="Modal Content"
               placeholder="The extracted content is: {{get-content-node}}"
               description="Content to display. Use {{node-id}} to reference action outputs"
               rows={4}
               value={data.config.modalContent || ''}
               onChange={(e) => updateNodeData('config.modalContent', e.target.value)}
             />
           </Stack>
         );      
      case 'element-click':
        return (
          <TextInput
            label="Element Selector"
            placeholder=".button, #submit"
            description="CSS selector for the element to click"
            value={data.config.selector || ''}
            onChange={(e) => updateNodeData('config.selector', e.target.value)}
          />
        );
      
      case 'navigate':
        return (
          <TextInput
            label="Navigate URL"
            placeholder="https://example.com/page"
            value={data.config.navigateUrl || ''}
            onChange={(e) => updateNodeData('config.navigateUrl', e.target.value)}
          />
        );
      
       case 'custom-script':
         return (
           <Textarea
             label="Custom JavaScript"
             placeholder="alert('Hello World!'); console.log('Custom script executed');"
             rows={6}
             value={data.config.customScript || ''}
             onChange={(e) => updateNodeData('config.customScript', e.target.value)}
           />
         );
       
       case 'llm-openai':
         return (
           <Stack gap="md">
             <Select
               label="OpenAI Credential"
               placeholder="Select an OpenAI API key"
               data={openaiCredentials.map(cred => ({
                 value: cred.id,
                 label: cred.name
               }))}
               value={data.config.credentialId || ''}
               onChange={(value) => updateNodeData('config.credentialId', value)}
               required
             />
             
             <Select
               label="Model"
               data={[
                 { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
                 { value: 'gpt-4', label: 'GPT-4' },
                 { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
                 { value: 'gpt-4o', label: 'GPT-4o' }
               ]}
               value={data.config.model || 'gpt-3.5-turbo'}
               onChange={(value) => updateNodeData('config.model', value)}
             />
             
             <Textarea
               label="Prompt"
               placeholder="You are a helpful assistant. User input: {{get-content-node}}"
               description="Use {{node-id}} to reference outputs from other actions"
               rows={4}
               value={data.config.prompt || ''}
               onChange={(e) => updateNodeData('config.prompt', e.target.value)}
               required
             />
             
             <NumberInput
               label="Max Tokens"
               placeholder="150"
               description="Maximum number of tokens to generate"
               min={1}
               max={4000}
               value={data.config.maxTokens || 150}
               onChange={(value) => updateNodeData('config.maxTokens', value)}
             />
             
             <NumberInput
               label="Temperature"
               placeholder="0.7"
               description="Controls randomness (0 = deterministic, 1 = creative)"
               min={0}
               max={1}
               step={0.1}
               decimalScale={1}
               value={data.config.temperature || 0.7}
               onChange={(value) => updateNodeData('config.temperature', value)}
             />
           </Stack>
         );
      
       default:
         return null;    }
  };

  const renderConditionProperties = (data: ConditionNodeData) => {
    switch (data.conditionType) {
      case 'element-exists':
        return (
          <TextInput
            label="Element Selector"
            placeholder=".element, #id"
            description="CSS selector to check for existence"
            value={data.config.selector || ''}
            onChange={(e) => updateNodeData('config.selector', e.target.value)}
          />
        );
      
      case 'custom-condition':
        return (
          <Textarea
            label="Custom Condition (JavaScript)"
            placeholder="return document.querySelector('.element').textContent.includes('text');"
            description="Return true or false"
            rows={4}
            value={data.config.customScript || ''}
            onChange={(e) => updateNodeData('config.customScript', e.target.value)}
          />
        );
      
      default:
        return null;
    }
  };

  const getNodeTypeColor = (type: string) => {
    switch (type) {
      case 'trigger': return 'red';
      case 'action': return 'blue';
      case 'condition': return 'orange';
      default: return 'gray';
    }
  };

  return (
    <Card withBorder p="md">
      <Group mb="md">
        <Text fw={500} c={getNodeTypeColor(node.type)}>
          {node.type.charAt(0).toUpperCase() + node.type.slice(1)} Node
        </Text>
      </Group>

      <Stack gap="md">
        {node.type === 'trigger' && renderTriggerProperties(node.data as TriggerNodeData)}
        {node.type === 'action' && renderActionProperties(node.data as ActionNodeData)}
        {node.type === 'condition' && renderConditionProperties(node.data as ConditionNodeData)}
      </Stack>
    </Card>
  );
};