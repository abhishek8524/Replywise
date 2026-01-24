// Service Worker for ReplyWise Extension

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_SELECTED_TEXT') {
    // This will be handled by content script
    sendResponse({ status: 'received' });
  }
});

// Context menu for right-click integration
chrome.runtime.onInstalled.addListener(() => {
  try {
    chrome.contextMenus.create({
      id: 'replywise-context',
      title: 'Generate Reply with ReplyWise',
      contexts: ['selection']
    });
  } catch (error) {
    console.log('Context menu creation error:', error);
  }
});

// Handle context menu clicks
if (chrome.contextMenus && chrome.contextMenus.onClicked) {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'replywise-context') {
      // Open popup with selected text
      const selectedText = info.selectionText;
      
      // Store selected text and open popup
      chrome.storage.local.set({ selectedText: selectedText }, () => {
        chrome.action.openPopup();
      });
    }
  });
}

// Handle requests to ReplyWise API
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GENERATE_REPLY') {
    console.log('Background: Received GENERATE_REPLY request', request.data);
    generateReply(request.data)
      .then(result => {
        console.log('Background: API call successful', result);
        sendResponse({ success: true, data: result });
      })
      .catch(error => {
        console.error('Background: API call failed', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Will respond asynchronously
  }
});

async function generateReply(data) {
  try {
    console.log('Background: Making fetch to http://localhost:8080/api/generate');
    const response = await fetch('http://localhost:8080/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    console.log('Background: Fetch response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Background: API error response:', errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Background: Parsed response:', result);
    return result;
  } catch (error) {
    console.error('Background: Fetch error:', error);
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to API server. Make sure the server is running on http://localhost:8080');
    }
    throw error;
  }
}
