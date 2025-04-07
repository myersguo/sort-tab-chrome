function sortTabs(sortBy: string) {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    // Separate tabs into grouped and ungrouped
    const groupedTabs: chrome.tabs.Tab[] = [];
    const ungroupedTabs: chrome.tabs.Tab[] = [];
    
    // Group tabs by their groupId
    const tabGroups = new Map<number, chrome.tabs.Tab[]>();
    
    tabs.forEach(tab => {
      if (tab.groupId && tab.groupId !== -1) {
        groupedTabs.push(tab);
        
        // Store tabs by their group ID
        if (!tabGroups.has(tab.groupId)) {
          tabGroups.set(tab.groupId, []);
        }
        tabGroups.get(tab.groupId)?.push(tab);
      } else {
        ungroupedTabs.push(tab);
      }
    });
    
    // Sort tabs within each group
    for (const [groupId, groupTabs] of tabGroups) {
      const sortedGroupTabs = groupTabs.sort((a, b) => {
        let valA = sortBy === 'url' ? a.url || '' : a.title || '';
        let valB = sortBy === 'url' ? b.url || '' : b.title || '';
        return valA.localeCompare(valB);
      });
      
      let firstTabInGroup = tabs.findIndex(t => t.groupId === groupId);
      sortedGroupTabs.forEach((tab, index) => {
        if (tab.id !== undefined) {
          chrome.tabs.move(tab.id, { index: firstTabInGroup + index });
        }
      });
    }
    
    // Sort ungrouped tabs
    const sortedUngroupedTabs = ungroupedTabs.sort((a, b) => {
      let valA = sortBy === 'url' ? a.url || '' : a.title || '';
      let valB = sortBy === 'url' ? b.url || '' : b.title || '';
      return valA.localeCompare(valB);
    });
    
    // Move all ungrouped tabs to the end
    const lastGroupedTabIndex = groupedTabs.length > 0 ? 
      Math.max(...groupedTabs.map(t => t.index)) : -1;
    
    sortedUngroupedTabs.forEach((tab, index) => {
      if (tab.id !== undefined) {
        chrome.tabs.move(tab.id, { index: lastGroupedTabIndex + index + 1 });
      }
    });
  });
  
  updateNextSortTime();
}

function updateNextSortTime() {
  chrome.storage.local.get(['autoSort', 'sortInterval'], (result) => {
    if (result.autoSort) {
      const intervalMinutes = result.sortInterval || 15;
      const nextSortTime = Date.now() + intervalMinutes * 60 * 1000;
      chrome.storage.local.set({ nextSortTime });
    }
  });
}

function setupSortAlarm(intervalMinutes: number) {
  chrome.alarms.clear('tabSortAlarm', () => {
    if (intervalMinutes > 0) {
      chrome.alarms.create('tabSortAlarm', {
        periodInMinutes: intervalMinutes
      });
      
      updateNextSortTime();
    }
  });
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  
  chrome.storage.local.get(['sortBy', 'autoSort', 'sortInterval'], (result) => {
    if (!result.sortBy) {
      chrome.storage.local.set({ sortBy: 'url' });
    }
    if (result.autoSort === undefined) {
      chrome.storage.local.set({ autoSort: false });
    }
    if (!result.sortInterval) {
      chrome.storage.local.set({ sortInterval: 15 }); 
    }
    
    if (result.autoSort) {
      setupSortAlarm(result.sortInterval);
    }
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'tabSortAlarm') {
    chrome.storage.local.get(['sortBy', 'autoSort'], (result) => {
      if (result.autoSort) {
        sortTabs(result.sortBy || 'url');
      }
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sortTabs') {
    chrome.storage.local.get(['sortBy'], (result) => {
      sortTabs(request.sortBy || result.sortBy || 'url');
      sendResponse({ message: 'success' });
    });
  }
  else if (request.action === 'updateAutoSort') {
    chrome.storage.local.set({ 
      autoSort: request.autoSort,
      sortInterval: request.sortInterval,
      sortBy: request.sortBy
    });
    
    if (request.autoSort) {
      setupSortAlarm(request.sortInterval);
    } else {
      chrome.alarms.clear('tabSortAlarm');
      chrome.storage.local.remove(['nextSortTime']);
    }
    sendResponse({ message: 'success' });
  }
  else if (request.action === 'getNextSortTime') {
    chrome.alarms.get('tabSortAlarm', (alarm) => {
      chrome.storage.local.get(['nextSortTime'], (result) => {
        sendResponse({ 
          nextSortTime: result.nextSortTime,
          alarmInfo: alarm
        });
      });
    });
    return true;
  }
  return true;
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    let needsAlarmUpdate = false;
    let autoSort = undefined;
    let sortInterval = undefined;
    
    if (changes.autoSort) {
      autoSort = changes.autoSort.newValue;
      needsAlarmUpdate = true;
    }
    if (changes.sortInterval) {
      sortInterval = changes.sortInterval.newValue;
      needsAlarmUpdate = true;
    }
    
    if (needsAlarmUpdate) {
      chrome.storage.local.get(['autoSort', 'sortInterval'], (result) => {
        if (autoSort === undefined) autoSort = result.autoSort;
        if (sortInterval === undefined) sortInterval = result.sortInterval;
        
        if (autoSort) {
          setupSortAlarm(sortInterval);
        } else {
          chrome.alarms.clear('tabSortAlarm');
          chrome.storage.local.remove(['nextSortTime']);
        }
      });
    }
  }
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['autoSort', 'sortInterval'], (result) => {
    if (result.autoSort) {
      setupSortAlarm(result.sortInterval || 15);
    }
  });
});
