import { loadCSS, decorateIcons } from '../../scripts/lib-franklin.js';

let playerCssLoaded = false;
let removeVideo;
let escHandler;

const CSS_CLASS_NAME_ICON_PLAY_VIDEO = 'icon-playvideo';
const HTML_PLAY_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="99.2px" height="99.2px">\n'
  + '    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>\n'
  + '    <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>\n'
  + '</svg>';

/**
 * Converts a Vimeo URL to the embeddable format.
 * Handles both regular Vimeo URLs (vimeo.com/{id}) and player URLs (player.vimeo.com/video/{id})
 * @param {string} url - The Vimeo URL to normalize
 * @returns {string} - The embeddable Vimeo URL
 */
const normalizeVimeoUrl = (url) => {
  try {
    const urlObj = new URL(url);

    // Check if it's already in the correct format
    if (urlObj.hostname === 'player.vimeo.com' && urlObj.pathname.startsWith('/video/')) {
      return url;
    }

    // Handle regular vimeo.com URLs
    if (urlObj.hostname === 'vimeo.com' || urlObj.hostname === 'www.vimeo.com') {
      // Extract video ID from pathname (e.g., /1126943910 or /video/1126943910)
      const pathMatch = urlObj.pathname.match(/\/(?:video\/)?(\d+)/);
      if (pathMatch && pathMatch[1]) {
        const videoId = pathMatch[1];
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }

    // Return original URL if we can't parse it
    return url;
  } catch (e) {
    console.warn('Failed to parse Vimeo URL:', url, e);
    return url;
  }
};

const getVimeoLinks = (block) => {
  const links = Array.from(block.querySelectorAll('a'));
  let previewLink = '';
  let modalLink = '';

  links.forEach((link) => {
    const { href } = link;
    // Check for any Vimeo URL
    if (href.includes('vimeo.com')) {
      const normalizedUrl = normalizeVimeoUrl(href);
      if (!previewLink) previewLink = normalizedUrl;
      else if (!modalLink) modalLink = normalizedUrl;
      // Hide the link and its preceding label (e.g., "Preview:", "Video:")
      const prev = link.previousSibling;
      if (prev && prev.nodeType === Node.TEXT_NODE) prev.textContent = '';
      link.style.display = 'none';
    }
  });

  return { previewLink, modalLink };
};

const buildVimeoBackground = (previewUrl) => {
  const url = new URL(previewUrl);
  const params = new URLSearchParams(url.search);
  params.set('autoplay', '1');
  params.set('muted', '1');
  params.set('loop', '1');
  params.set('background', '1');

  const fullSrc = `${url.origin}${url.pathname}?${params.toString()}`;

  const container = document.createElement('div');
  container.className = 'video-hero-background';

  const iframe = document.createElement('iframe');
  iframe.className = 'hero-autoplay-background-iframe';
  iframe.src = fullSrc;
  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
  iframe.setAttribute('title', document.title);
  iframe.setAttribute('loading', 'eager');
  const overlayDiv = document.createElement('div');
  overlayDiv.className = 'white-overlay';
  overlayDiv.style.cssText = 'position:absolute;inset:0;pointer-events:none;';

  container.append(iframe, overlayDiv);
  return container;
};

const ensurePlayerCSSLoaded = () => {
  if (!playerCssLoaded) {
    loadCSS(`${window.hlx.codeBasePath}/blocks/video/asset-viewer/asset-viewer.css`, () => {
      playerCssLoaded = true;
    });
  }
};
// (optional) put this once near top to preload Vimeo API if you’ll use it later
let vimeoApiReady;
function ensureVimeoAPI() {
  if (window.Vimeo?.Player) return Promise.resolve();
  return (vimeoApiReady ||= new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://player.vimeo.com/api/player.js';
    s.onload = res; s.onerror = rej; document.head.appendChild(s);
  }));
}

const loadVideo = async (block, videoLink) => {
  ensurePlayerCSSLoaded();

  const main = document.querySelector('main');

  // Backdrop
  const overlay = document.createElement('div');
  overlay.classList.add('asset-viewer-overlay');
  main.prepend(overlay);

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.classList.add('asset-viewer-toolbar');
  const close = document.createElement('div');
  close.classList.add('asset-viewer-close');
  toolbar.appendChild(close);
  main.prepend(toolbar);

  // Frame (full-screen) that centers the video shell
  const frame = document.createElement('div');
  frame.className = 'asset-viewer-frame';
  frame.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10000;
    display: grid;
    place-items: center;
    pointer-events: none;
  `;
  main.prepend(frame);

  // Video shell (the centered box the icon should sit on)
  const shell = document.createElement('div');
  shell.className = 'video-modal';
  shell.style.cssText = `
    position: relative;
    pointer-events: auto;
    background: #000;
    border-radius: 12px;
    box-shadow: 0 12px 48px rgba(0,0,0,.35);
    width: min(92vw, 1280px);
    aspect-ratio: 16 / 9;
    max-height: 80vh;
    overflow: hidden;
    margin: 0;
    padding: 0;
  `;

  // Build NON-autoplay URL; we'll use the overlay to start playback
  const url = new URL(videoLink);
  const params = new URLSearchParams(url.search);
  params.set('autoplay', '0');
  params.set('muted', '1');
  params.set('loop', '0');
  params.delete('background');
  const fullSrc = `${url.origin}${url.pathname}?${params.toString()}`;

  // Iframe fills the shell
  const iframe = document.createElement('iframe');
  iframe.className = 'hero-autoplay-iframe';
  iframe.src = fullSrc;
  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
  iframe.setAttribute('playsinline', '');
  iframe.setAttribute('title', document.title);
  iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  iframe.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    min-width: 100%;
    min-height: 100%;
    border: 0;
    border-radius: 12px;
    object-fit: cover;
  `;

  // Play overlay centered ON the video
  const playOverlay = document.createElement('button');
  playOverlay.className = 'video-play-overlay';
  playOverlay.setAttribute('aria-label', 'Play video');
  playOverlay.innerHTML = HTML_PLAY_ICON;
  playOverlay.style.position = 'absolute';
  playOverlay.style.inset = '0';
  playOverlay.style.display = 'grid';
  playOverlay.style.placeItems = 'center';
  playOverlay.style.cursor = 'pointer';
  playOverlay.style.background = 'transparent';
  playOverlay.style.border = '0';
  playOverlay.style.zIndex = '2';

  // Compose
  shell.append(iframe, playOverlay);
  frame.appendChild(shell);

  // Ensure iframe loads and is visible
  iframe.onload = () => {
    console.log('Iframe loaded successfully');
    iframe.style.opacity = '1';
  };
  iframe.onerror = () => {
    console.error('Iframe failed to load');
  };
  iframe.style.opacity = '0';
  setTimeout(() => {
    iframe.style.opacity = '1';
  }, 100);

  // Close handlers
  removeVideo = () => {
    overlay.removeEventListener('click', removeVideo);
    close.removeEventListener('click', removeVideo);
    window.removeEventListener('keydown', escHandler);
    frame.remove();
    toolbar.remove();
    overlay.remove();
  };
  const escHandler = (e) => { if (e.key === 'Escape') removeVideo(); };
  overlay.addEventListener('click', removeVideo);
  close.addEventListener('click', removeVideo);
  window.addEventListener('keydown', escHandler);

  // Click-to-play with sound via API
  await ensureVimeoAPI().catch(() => {});
  const startPlayback = async () => {
    try {
      const player = window.Vimeo ? new window.Vimeo.Player(iframe) : null;
      if (player) {
        // First try to play with audio
        await player.setMuted(false);
        await player.play();
      }
    } catch (error) {
      console.warn('Could not play with audio, trying muted:', error);
      try {
        // Fallback: play muted if audio autoplay is blocked
        const player = window.Vimeo ? new window.Vimeo.Player(iframe) : null;
        if (player) {
          await player.setMuted(true);
          await player.play();
          // Try to unmute after a short delay (some browsers allow this after user interaction)
          setTimeout(async () => {
            try {
              await player.setMuted(false);
            } catch (e) {
              console.warn('Could not unmute video:', e);
            }
          }, 100);
        }
      } catch (fallbackError) {
        console.error('Could not start video playback:', fallbackError);
      }
    } finally {
      playOverlay.remove(); // hide overlay once playback begins / user clicks
    }
  };
  playOverlay.addEventListener('click', startPlayback);
  playOverlay.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startPlayback(); }
  });
};

const mainCopy = (video) => {
  const heroCopy = video.querySelectorAll('h1, h2');
  if (heroCopy.length > 0) {
    const copyDiv = document.createElement('div');
    copyDiv.classList.add('hero-copy');
    heroCopy.forEach((el) => copyDiv.appendChild(el));
    // Insert hero-copy after the video background but before any existing content
    const videoBg = video.querySelector('.video-hero-background');
    if (videoBg) {
      videoBg.insertAdjacentElement('afterend', copyDiv);
    } else {
      video.appendChild(copyDiv);
    }
  }
  const img = video.querySelector('picture img');
  if (img) {
    img.classList.add('hero-image');
  }
};

const createButtonRow = (video) => {
  const links = Array.from(video.querySelectorAll('a')).filter((a, idx) => idx !== 0);

  if (links.length > 0) {
    const buttonRow = document.createElement('div');
    buttonRow.classList.add('button-row');

    links.forEach((link, i) => {
      let buttonContainer = link.closest('.button-container');
      if (!buttonContainer) {
        buttonContainer = document.createElement('div');
        buttonContainer.classList.add('button-container');
        link.parentNode.insertBefore(buttonContainer, link);
        buttonContainer.appendChild(link);
      }
      link.classList.add('button');
      if (i % 2 === 1) {
        link.classList.add('secondary');
      }
      buttonRow.appendChild(buttonContainer);
    });

    // Insert button-row after hero-copy to maintain proper order
    const heroCopy = video.querySelector('.hero-copy');
    if (heroCopy) {
      heroCopy.insertAdjacentElement('afterend', buttonRow);
    } else {
      video.appendChild(buttonRow);
    }
  }
};

export default async function decorate(block) {
  const { previewLink, modalLink } = getVimeoLinks(block);
  if (!previewLink) return;

  // Add container class for CSS targeting
  block.classList.add('hero-autoplay-container');

  const previewBg = buildVimeoBackground(previewLink);
  block.prepend(previewBg);

  if (modalLink) {
    const playBtn = document.createElement('span');
    playBtn.className = CSS_CLASS_NAME_ICON_PLAY_VIDEO;
    playBtn.innerHTML = HTML_PLAY_ICON;
    playBtn.setAttribute('role', 'button');
    playBtn.setAttribute('tabindex', '0');
    // Append to video background for proper mobile centering
    previewBg.append(playBtn);
  }
  const trigger = () => loadVideo(block, modalLink);
  block.addEventListener('click', (e) => {
    if (e.target.closest('.icon-playvideo')) trigger();
  });
  block.addEventListener('keydown', (e) => {
    if (
      (e.key === 'Enter' || e.key === ' ')
      && e.target.closest('.icon-playvideo')
    ) {
      e.preventDefault();
      trigger();
    }
  });

  mainCopy(block);
  createButtonRow(block);
  await decorateIcons(block);
  const btn = block.querySelector('.icon-playvideo');
  btn?.addEventListener('click', () => loadVideo(block, modalLink));
}
