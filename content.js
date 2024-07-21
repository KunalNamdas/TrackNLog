chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'reloadData') {
      chrome.storage.local.get('apiCalls', (data) => {
        sendResponse(data.apiCalls);
      });
      return true;
    }
  });
  