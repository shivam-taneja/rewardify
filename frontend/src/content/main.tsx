import { StrictMode } from 'react';
import { createRoot, Root } from 'react-dom/client';
import '../styles/index.css';

import RewardifyButton from '@/components/rewardify-button';

console.log('[REWARDIFY] Content script loaded!');

// Utility to insert flex-row styling to the subscribe button container
function styleSubscribeButtonContainer(container: HTMLElement) {
  container.style.display = 'flex';
  container.style.flexDirection = 'row';
  container.style.alignItems = 'center';
  container.style.gap = '8px';
}

// Find subscribe button on video or channel page
function findSubscribeButton() {
  // Video page:
  const videoSubBtns = Array.from(document.querySelectorAll('#subscribe-button')) as HTMLElement[];
  const videoBtn = videoSubBtns.find(btn => {
    const rect = btn.getBoundingClientRect();
    const style = window.getComputedStyle(btn);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      !btn.classList.contains('skeleton-bg-color')
    );
  });
  if (videoBtn) return videoBtn;
  // Channel page:
  const channelBtn = document.querySelector('.ytSubscribeButtonViewModelContainer') as HTMLElement | null;
  if (channelBtn) return channelBtn;
  return null;
}

// Improved mounting with retry logic
function tryMountRewardifyReactButton(retries = 15, delay = 200) {
  function attempt(retriesLeft = retries) {
    const subscribeButton = findSubscribeButton();
    if (!subscribeButton) {
      if (retriesLeft > 0) setTimeout(() => attempt(retriesLeft - 1), delay);
      return;
    }

    styleSubscribeButtonContainer(subscribeButton);

    let reactBtnContainer = subscribeButton.querySelector('.rewardify-react-btn-container') as HTMLElement | null;
    if (!reactBtnContainer) {
      reactBtnContainer = document.createElement('div');
      reactBtnContainer.className = 'rewardify-react-btn-container';
      subscribeButton.appendChild(reactBtnContainer);
    }

    // ✅ store the root on the element itself
    let containerRoot = (reactBtnContainer as any)._reactRoot as Root | null;
    if (!containerRoot) {
      containerRoot = createRoot(reactBtnContainer);
      (reactBtnContainer as any)._reactRoot = containerRoot;
    }

    // Always just render to the existing root
    containerRoot.render(
      <StrictMode>
        <RewardifyButton />
      </StrictMode>
    );
  }

  attempt();
}

// Observe the DOM for YouTube navigation
const observer = new MutationObserver(() => {
  tryMountRewardifyReactButton();
});
observer.observe(document.body, { childList: true, subtree: true });
// First page load
tryMountRewardifyReactButton();