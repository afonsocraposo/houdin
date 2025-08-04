import { StorageManager } from '../services/storage';

console.log('Background script loaded')

const runtime = (typeof browser !== 'undefined' ? browser : chrome) as any

runtime.runtime.onInstalled.addListener(() => {
  console.log('Extension installed')
})

// Handle messages from content scripts
runtime.runtime.onMessage.addListener((message: any, _sender: any, sendResponse: any) => {
  if (message.type === 'OPENAI_API_CALL') {
    handleOpenAIApiCall(message.data)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep the message channel open for async response
  }
});

// OpenAI API call handler
async function handleOpenAIApiCall(data: {
  credentialId: string;
  model: string;
  prompt: string;
  maxTokens: number;
  temperature: number;
}): Promise<string> {
  try {
    // Get the credential
    const storageManager = StorageManager.getInstance();
    const credentials = await storageManager.getCredentials();
    const credential = credentials.find(c => c.id === data.credentialId);
    
    if (!credential) {
      throw new Error('OpenAI credential not found');
    }

    if (credential.service !== 'openai') {
      throw new Error('Invalid credential: not an OpenAI credential');
    }

    // Prepare the request
    const requestBody = {
      model: data.model,
      messages: [
        {
          role: 'user' as const,
          content: data.prompt
        }
      ],
      max_tokens: data.maxTokens,
      temperature: data.temperature
    };

    // Make the API call
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${credential.value}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const responseData = await response.json();
    
    if (!responseData.choices || responseData.choices.length === 0) {
      throw new Error('No response from OpenAI API');
    }

    return responseData.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API call failed in background:', error);
    throw error;
  }
}

// For manifest v2, use browserAction instead of action
if (runtime.browserAction) {
  runtime.browserAction.onClicked.addListener((tab: any) => {
    console.log('Extension icon clicked', tab)
  })
} else if (runtime.action) {
  runtime.action.onClicked.addListener((tab: any) => {
    console.log('Extension icon clicked', tab)
  })
}

// Handle navigation to changeme.config
runtime.tabs.onUpdated.addListener((tabId: number, changeInfo: any) => {
  if (changeInfo.url && changeInfo.url.includes('changeme.config')) {
    // Redirect to the config page
    const configUrl = runtime.runtime.getURL('src/config/config.html')
    runtime.tabs.update(tabId, { url: configUrl })
  }
})

// Alternative: Listen for navigation attempts
if (runtime.webNavigation) {
  runtime.webNavigation.onBeforeNavigate.addListener((details: any) => {
    if (details.url.includes('changeme.config')) {
      const configUrl = runtime.runtime.getURL('src/config/config.html')
      runtime.tabs.update(details.tabId, { url: configUrl })
    }
  })
}