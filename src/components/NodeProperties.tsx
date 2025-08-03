import React from 'react';
import { Stack, TextInput, Select, Textarea, Text, Card, Group } from '@mantine/core';
import { WorkflowNode, TriggerNodeData, ActionNodeData, ConditionNodeData } from '../types/workflow';

interface NodePropertiesProps {
  node: WorkflowNode | null;
  onNodeUpdate: (updatedNode: WorkflowNode) => void;
}

export const NodeProperties: React.FC<NodePropertiesProps> = ({ node, onNodeUpdate }) => {
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
      case 'url-match':
        return (
          <TextInput
            label="URL Pattern"
            placeholder="*://github.com/*/pull/*"
            description="Use * for wildcards"
            value={data.config.urlPattern || ''}
            onChange={(e) => updateNodeData('config.urlPattern', e.target.value)}
          />
        );
      
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
              label="Source Selector"
              placeholder=".content, #description"
              description="Element to get content from"
              value={data.config.sourceSelector || ''}
              onChange={(e) => updateNodeData('config.sourceSelector', e.target.value)}
            />
            
            <TextInput
              label="Modal Title"
              placeholder="Information, Details, etc."
              value={data.config.modalTitle || ''}
              onChange={(e) => updateNodeData('config.modalTitle', e.target.value)}
            />
            
            <TextInput
              label="Modal Content Prefix"
              placeholder="Copied content: "
              description="Text to show before the copied content"
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
      
      default:
        return null;
    }
  };

  const renderConditionProperties = (data: ConditionNodeData) => {
    switch (data.conditionType) {
      case 'url-match':
        return (
          <TextInput
            label="URL Pattern"
            placeholder="*://github.com/*/pull/*"
            description="Use * for wildcards"
            value={data.config.urlPattern || ''}
            onChange={(e) => updateNodeData('config.urlPattern', e.target.value)}
          />
        );
      
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