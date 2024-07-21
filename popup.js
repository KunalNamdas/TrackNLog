document.addEventListener('DOMContentLoaded', () => {
  const clearButton = document.getElementById('clearButton');
  const exportButton = document.getElementById('exportButton');
  const logContainer = document.getElementById('logContainer');
  const searchInput = document.getElementById('searchInput');
  const methodFilter = document.getElementById('methodFilter');
  const responseTimeElement = document.getElementById('responseTime');

  let allLogs = [];

  const displayLogs = (logs) => {
    logContainer.innerHTML = '';
    if (logs && logs.length > 0) {
      logs.forEach((log, index) => {
        const logElement = document.createElement('div');
        logElement.className = 'log';
        logElement.innerHTML = `
          <strong>URL:</strong> <span>${log.url}</span><br>
          <strong>Method:</strong> <span>${log.method}</span><br>
          <strong>Status:</strong> <span>${log.statusCode}</span><br>
          <strong>Response Time:</strong> <span>${log.responseTime ? log.responseTime + ' milliseconds' : 'Calculating...'}</span>
          <button class="clear-log" data-index="${index}">&times;</button>
        `;
        logContainer.appendChild(logElement);
      });
    } else {
      logContainer.textContent = 'No logs available.';
    }
  };

  const filterLogs = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedMethod = methodFilter.value;

    const filteredLogs = allLogs.filter(log => {
      const matchesSearch = log.url.toLowerCase().includes(searchTerm);
      const matchesMethod = selectedMethod === 'all' || log.method === selectedMethod;
      return matchesSearch && matchesMethod;
    });

    displayLogs(filteredLogs);
    return filteredLogs; // Return filtered logs
  };

  const exportLogs = () => {
    const filteredLogs = filterLogs(); // Get the filtered logs
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'filtered_logs.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const measureRequestTime = (url, index) => {
    const startTime = performance.now(); // Capture start time

    fetch(url)
      .then(response => {
        const endTime = performance.now(); // Capture end time
        const duration = endTime - startTime; // Calculate duration
        console.log(`Request to ${url} took ${duration.toFixed(2)} milliseconds.`);

        // Update the log with response time
        allLogs[index].responseTime = duration.toFixed(2);
        chrome.storage.local.set({ apiCalls: allLogs }, () => {
          displayLogs(allLogs);
        });
      })
      .catch(error => {
        console.error('Error:', error);
        allLogs[index].responseTime = 'Error';
        chrome.storage.local.set({ apiCalls: allLogs }, () => {
          displayLogs(allLogs);
        });
      });
  };

  clearButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'clearLogs' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error clearing logs:', chrome.runtime.lastError);
      } else if (response && response.status === 'Logs cleared') {
        console.log('Logs cleared successfully');
        allLogs = [];
        displayLogs([]);
      } else {
        console.error('Unexpected response:', response);
      }
    });
  });

  exportButton.addEventListener('click', exportLogs);

  logContainer.addEventListener('click', (event) => {
    if (event.target.classList.contains('clear-log')) {
      const logIndex = event.target.getAttribute('data-index');
      allLogs.splice(logIndex, 1);
      chrome.storage.local.set({ apiCalls: allLogs }, () => {
        filterLogs();
      });
    }
  });

  searchInput.addEventListener('input', filterLogs);
  methodFilter.addEventListener('change', filterLogs);

  chrome.runtime.sendMessage({ action: 'reloadData' }, (logs) => {
    if (chrome.runtime.lastError) {
      console.error('Error loading data:', chrome.runtime.lastError);
      logContainer.textContent = 'Error loading logs.';
    } else {
      console.log('Logs reloaded successfully:', logs);
      allLogs = logs;

      // Measure response time for each log URL
      allLogs.forEach((log, index) => {
        measureRequestTime(log.url, index);
      });

      displayLogs(logs);
    }
  });
});
