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

function isOnValidYouTubePage() {
  const path = location.pathname;

  // Watch pages: /watch?v=...
  if (path === '/watch') return true;

  // Shorts pages: /shorts/VIDEO_ID
  if (path.startsWith('/shorts/')) return true;

  // Channel pages: /@username or /channel/UCxxxxxx
  if (path.startsWith('/@') || path.startsWith('/channel/')) return true;

  // Otherwise (home, search, trending, etc)
  return false;
}

function getChannelInfo() {
  if (!isOnValidYouTubePage()) return null;

  const path = location.pathname;

  // 🎥 Watch page
  if (path === '/watch') {
    const owner = document.querySelector('ytd-watch-flexy ytd-video-owner-renderer');
    if (!owner) return null;

    const name = owner.querySelector('#channel-name #text a')?.textContent?.trim() || null;
    const avatarUrl = (owner.querySelector('#avatar img') as HTMLImageElement | null)?.src || null;
    const subCount = owner.querySelector('#owner-sub-count')?.textContent?.trim() || null;

    return { name, avatarUrl, subCount };
  }

  // 🎬 Shorts page
  if (path.startsWith('/shorts/')) {
    const owner = document.querySelector('yt-reel-channel-bar-view-model');
    if (!owner) return null;

    const name = owner.querySelector('a.yt-core-attributed-string__link')?.textContent?.trim() || null;
    const avatarUrl = (owner.querySelector('img.yt-spec-avatar-shape__image') as HTMLImageElement | null)?.src || null;
    const subCount = null;

    return { name, avatarUrl, subCount };
  }

  // 📺 Channel page (updated selectors)
  if (path.startsWith('/@') || path.startsWith('/channel/')) {
    const headerInfo = document.querySelector('.yt-page-header-view-model__page-header-headline-info');
    if (!headerInfo) return null;

    // Channel Name
    const name =
      headerInfo.querySelector('.yt-page-header-view-model__page-header-title h1 span')?.textContent?.trim() ||
      null;

    // Avatar
    // Try YouTube's new avatar class, fallback to decorated avatar class:
    let avatarUrl: string | null = null;
    const avatarEl =
      document.querySelector('.yt-page-header-view-model__page-header-headline img') ||
      document.querySelector('yt-decorated-avatar-view-model img');
    if (avatarEl && (avatarEl as HTMLImageElement).src) {
      avatarUrl = (avatarEl as HTMLImageElement).src;
    }

    // Subscribers count (find span containing "subscriber")
    let subCount: string | null = null;
    const metadataSpans = headerInfo.querySelectorAll('.yt-content-metadata-view-model__metadata-text');
    metadataSpans.forEach((span) => {
      if (
        !subCount &&
        span.textContent &&
        span.textContent.toLowerCase().includes('subscriber')
      ) {
        subCount = span.textContent.trim();
      }
    });

    return { name, avatarUrl, subCount };
  }

  return null;
}

// Listen for direct requests from the sidepanel
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "GET_CHANNEL_INFO") {
    sendResponse(getChannelInfo());
  }
  return true;
});

// Notify sidepanel on SPA navigation/page change (push current info, or null if not on a real YT video)
let lastChannelInfo: { name: string | null; avatarUrl: string | null; subCount: string | null } | null = null;
function checkAndBroadcastChannelInfo() {
  const info = getChannelInfo();

  // Compare previous info and broadcast changes (including "null" if you navigate away)
  if (JSON.stringify(info) !== JSON.stringify(lastChannelInfo)) {
    lastChannelInfo = info;
    chrome.runtime.sendMessage({ type: "CHANNEL_INFO_UPDATED", info }); // info=null means no channel
  }
}

// Watch for site changes regularly (SPAs like YouTube)
const channelInfoObserver = new MutationObserver(checkAndBroadcastChannelInfo);
channelInfoObserver.observe(document.body, { childList: true, subtree: true });
// Also check immediately at load
checkAndBroadcastChannelInfo();