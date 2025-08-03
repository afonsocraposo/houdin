export const createModal = (title: string, content: string): void => {
  // Add CSS reset styles for the modal
  const modalStyles = `
    #changeme-modal, #changeme-modal * {
      box-sizing: border-box !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    #changeme-modal h1, #changeme-modal h2, #changeme-modal h3, 
    #changeme-modal h4, #changeme-modal h5, #changeme-modal h6 {
      font-weight: 600 !important;
      color: #333 !important;
      background: transparent !important;
    }
    #changeme-modal p, #changeme-modal div, #changeme-modal span {
      color: #333 !important;
      background: transparent !important;
    }
  `
  
  // Create style element
  const styleElement = document.createElement('style')
  styleElement.textContent = modalStyles
  document.head.appendChild(styleElement)

  const modalHtml = `
    <div id="changeme-modal" style="
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background: rgba(0, 0, 0, 0.5) !important;
      z-index: 10000 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    ">
      <div style="
        background: white !important;
        padding: 24px !important;
        border-radius: 8px !important;
        max-width: 600px !important;
        max-height: 80vh !important;
        overflow-y: auto !important;
        position: relative !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        color: #333 !important;
      ">
        <div style="
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          margin-bottom: 16px !important;
          padding-bottom: 12px !important;
          border-bottom: 1px solid #e0e0e0 !important;
        ">
          <h2 style="
            margin: 0 !important; 
            padding: 0 !important;
            font-size: 18px !important; 
            font-weight: 600 !important;
            color: #333 !important;
            background: transparent !important;
          ">${title}</h2>
          <button id="changeme-modal-close" style="
            background: none !important;
            border: none !important;
            font-size: 24px !important;
            cursor: pointer !important;
            padding: 4px !important;
            color: #666 !important;
            margin: 0 !important;
          ">&times;</button>
        </div>
        <div style="
          line-height: 1.6 !important;
          color: #333 !important;
          background: transparent !important;
          white-space: pre-wrap !important;
          max-height: 400px !important;
          overflow-y: auto !important;
          padding: 0 !important;
          margin: 0 !important;
        ">${content}</div>
      </div>
    </div>
  `
  
  const modalElement = document.createElement('div')
  modalElement.innerHTML = modalHtml
  document.body.appendChild(modalElement)
  
  // Close modal handlers
  const closeModal = () => {
    if (document.body.contains(modalElement)) {
      document.body.removeChild(modalElement)
    }
    // Remove the style element when modal closes
    if (document.head.contains(styleElement)) {
      document.head.removeChild(styleElement)
    }
  }
  
  modalElement.querySelector('#changeme-modal-close')?.addEventListener('click', closeModal)
  modalElement.querySelector('#changeme-modal')?.addEventListener('click', (e) => {
    if (e.target === modalElement.querySelector('#changeme-modal')) {
      closeModal()
    }
  })
  
  // Close on Escape key
  const escapeHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal()
      document.removeEventListener('keydown', escapeHandler)
    }
  }
  document.addEventListener('keydown', escapeHandler)
}