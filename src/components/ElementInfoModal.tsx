import React from 'react';

interface ElementInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  elementInfo: {
    selector: string;
    element: {
      tagName: string;
      className: string;
      id: string;
      textContent: string;
    };
  } | null;
}

export const ElementInfoModal: React.FC<ElementInfoModalProps> = ({ isOpen, onClose, elementInfo }) => {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  if (!isOpen || !elementInfo) return null;

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const InfoRow = ({ label, value, fieldName }: { label: string; value: string; fieldName: string }) => (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ 
        fontSize: '14px', 
        fontWeight: '600', 
        marginBottom: '4px',
        color: '#333'
      }}>
        {label}
      </div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        backgroundColor: '#f8f9fa',
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #dee2e6'
      }}>
        <code style={{ 
          flex: 1, 
          fontSize: '12px',
          fontFamily: 'monospace',
          wordBreak: 'break-all',
          backgroundColor: 'transparent',
          padding: 0,
          border: 'none'
        }}>
          {value || '(empty)'}
        </code>
        <button
          onClick={() => copyToClipboard(value, fieldName)}
          style={{
            padding: '4px 8px',
            fontSize: '11px',
            border: '1px solid #007bff',
            backgroundColor: copiedField === fieldName ? '#28a745' : '#007bff',
            color: 'white',
            borderRadius: '3px',
            cursor: 'pointer',
            minWidth: '60px',
            transition: 'background-color 0.2s'
          }}
        >
          {copiedField === fieldName ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={onClose}
      >
        {/* Modal */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: '1px solid #dee2e6'
          }}>
            <h2 style={{ 
              margin: 0, 
              fontSize: '18px',
              color: '#212529'
            }}>
              Selected Element Information
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6c757d',
                padding: '0',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div>
            <InfoRow 
              label="CSS Selector" 
              value={elementInfo.selector} 
              fieldName="selector" 
            />
            
            <InfoRow 
              label="Tag Name" 
              value={elementInfo.element.tagName.toLowerCase()} 
              fieldName="tagName" 
            />
            
            {elementInfo.element.id && (
              <InfoRow 
                label="ID" 
                value={elementInfo.element.id} 
                fieldName="id" 
              />
            )}
            
            {elementInfo.element.className && (
              <InfoRow 
                label="Class Names" 
                value={elementInfo.element.className} 
                fieldName="className" 
              />
            )}
            
            {elementInfo.element.textContent && (
              <InfoRow 
                label="Text Content" 
                value={elementInfo.element.textContent} 
                fieldName="textContent" 
              />
            )}
          </div>

          {/* Footer */}
          <div style={{ 
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid #dee2e6',
            textAlign: 'right'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                border: '1px solid #6c757d',
                backgroundColor: '#6c757d',
                color: 'white',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};