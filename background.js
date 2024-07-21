let apiCalls = [];

chrome.webRequest.onCompleted.addListener((details) => {
  apiCalls.push({
    url: details.url,
    method: details.method,
    statusCode: details.statusCode,
    timeStamp: details.timeStamp
  });
  chrome.storage.local.set({ apiCalls });
}, { urls: ["<all_urls>"] });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in background:', request);
  if (request.action === 'clearLogs') {
    apiCalls = [];
    chrome.storage.local.set({ apiCalls }, () => {
      console.log('Logs cleared in background');
      sendResponse({ status: 'Logs cleared' });
    });
    return true; // Keeps the message channel open for the async response
  } else if (request.action === 'reloadData') {
    chrome.storage.local.get('apiCalls', (data) => {
      console.log('Data reloaded in background:', data.apiCalls);
      sendResponse(data.apiCalls || []);
    });
    return true; // Keeps the message channel open for the async response
  }
  return false; // If no action matches, close the message channel
});
