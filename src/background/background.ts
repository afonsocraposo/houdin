console.log('Background script loaded')

const runtime = (typeof browser !== 'undefined' ? browser : chrome) as any

runtime.runtime.onInstalled.addListener(() => {
  console.log('Extension installed')
})

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