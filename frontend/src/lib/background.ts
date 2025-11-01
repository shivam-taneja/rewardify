chrome.runtime.onMessage.addListener((message, sender) => {
  if (message === 'open-sidepanel') {
    try {
      if (sender.tab && sender.tab.windowId) {
        chrome.sidePanel.open({ windowId: sender.tab.windowId });
      } else {
        if (chrome.windows) {
          chrome.windows.getCurrent((window) => {
            if (window.id !== undefined) {
              chrome.sidePanel.open({ windowId: window.id });
            } else {
              console.error('window.id is undefined, cannot open side panel.');
            }
          });
        }
      }
    } catch (error) {
      console.error("Error opening side panel:", error);
    }
  }
});