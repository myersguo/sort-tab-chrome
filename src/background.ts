// src/background.ts
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed')
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sortTabs') {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      const sortedTabs = tabs.sort((a, b) => {
        let valA = request.sortBy === 'url' ? a.url || '' : a.title || ''
        let valB = request.sortBy === 'url' ? b.url || '' : b.title || ''
        return valA.localeCompare(valB)
      })

      sortedTabs.forEach((tab, index) => {
        if (tab.id !== undefined) {
          chrome.tabs.move(tab.id, { index })
        }
      })
    })
  }
  sendResponse({ message: 'success' })
  return true
})
