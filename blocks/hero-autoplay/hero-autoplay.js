import { createOptimizedPicture, decorateIcons, loadCSS } from '../../scripts/lib-franklin.js';

let playerCssLoaded = false;
let removeVideo;
let escHandler;

const CSS_CLASS_NAME_ICON_PLAY_VIDEO = 'icon-playvideo';
const HTML_PLAY_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="99.2px" height="99.2px">\n'
  + '    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>\n'
  + '    <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>\n'
  + '</svg>';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const embedVimeo = (url, autoplay, background) => {
  // Clone query params and keep existing ones like ?h=TOKEN
  const params = new URLSearchParams(url.search);

  if (autoplay) params.set('autoplay', '1');
  if (background) params.set('background', '1');

  const fullSrc = `${url.origin}${url.pathname}?${params.toString()}`;

  const temp = document.createElement('div');
  temp.innerHTML = `
    <div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
      <iframe src="${fullSrc}"
        style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;"
        frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen
        title="Content from Vimeo" loading="lazy">
      </iframe>
    </div>`;
  return temp.children.item(0);
};

const loadVideoEmbed = (block, link, autoplay, background) => {
  if (block.dataset.embedLoaded === 'true') return;

  const url = new URL(link);
  const isVimeo = link.includes('vimeo.com');

  if (!isVimeo) return;

  const embedWrapper = embedVimeo(url, autoplay, background);
  block.append(embedWrapper);
  embedWrapper.querySelector('iframe').addEventListener('load', () => {
    block.dataset.embedLoaded = true;
  });
};

const ensurePlayerCSSLoaded = () => {
  if (!playerCssLoaded) {
    loadCSS(`${window.hlx.codeBasePath}/blocks/video/asset-viewer/asset-viewer.css`, () => {
      playerCssLoaded = true;
    });
  }
};

const loadVideo = (video, videoLink) => {
  ensurePlayerCSSLoaded();

  const main = document.querySelector('main');
  const overlays = createVideoOverlays(main);

  const url = new URL(videoLink);
  const params = new URLSearchParams(url.search);
  params.set('autoplay', '1');

  const embedUrl = `${url.origin}${url.pathname}?${params.toString()}`;

  const videoIframe = document.createElement('iframe');
  videoIframe.classList.add('video-player-iframe');
  videoIframe.setAttribute('allowfullscreen', '');
  videoIframe.setAttribute('title', 'Content from Vimeo');
  videoIframe.src = embedUrl;

  main.prepend(videoIframe);
  registerEventListeners(main, overlays, videoIframe);
};

const addPlayButton = (video, videoLink) => {
  const playButton = document.createElement('span');
  playButton.classList.add(CSS_CLASS_NAME_ICON_PLAY_VIDEO);
  playButton.innerHTML = HTML_PLAY_ICON;

  playButton.dataset.videoUrl = videoLink;

  playButton.addEventListener('click', (e) => {
    e.stopPropagation();
    loadVideo(video, videoLink);
  });

  const img = video.querySelector('picture');
  if (img && img.parentNode) {
    img.parentNode.appendChild(playButton);
  }
};

const createVideoOverlays = (main) => {
  const overlay = document.createElement('div');
  overlay.classList.add('asset-viewer-overlay');
  main.prepend(overlay);

  const toolbar = document.createElement('div');
  toolbar.classList.add('asset-viewer-toolbar');

  const toolbarClose = document.createElement('div');
  toolbarClose.classList.add('asset-viewer-close');
  toolbar.appendChild(toolbarClose);
  main.prepend(toolbar);

  return {
    overlay,
    toolbar,
    toolbarClose,
  };
};

const createRemoveVideoHandler = (main, overlays, videoIframe) => () => {
  overlays.overlay.removeEventListener('click', removeVideo);
  overlays.toolbarClose.removeEventListener('click', removeVideo);
  window.removeEventListener('keydown', escHandler);

  main.removeChild(overlays.overlay);
  main.removeChild(overlays.toolbar);
  main.removeChild(videoIframe);
};

const registerEventListeners = (main, overlays, videoIframe) => {
  removeVideo = createRemoveVideoHandler(main, overlays, videoIframe);
  escHandler = (event) => {
    if (event.key === 'Escape' || event.key === 'Esc') {
      removeVideo();
    }
  };

  overlays.overlay.addEventListener('click', removeVideo);
  overlays.toolbarClose.addEventListener('click', removeVideo);
  window.addEventListener('keydown', escHandler);
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

    if (video.firstElementChild) {
      video.firstElementChild.appendChild(buttonRow);
    } else {
      video.appendChild(buttonRow);
    }
  }
};

const optimizeHero = (video) => {
  const img = video.querySelector('img');
  if (img) {
    const widths = [375, 768, 1024, 1600, 1920];
    const imgHeight = Math.floor((img.height * 1024) / img.width);
    const accessHero = createOptimizedPicture(
      img.src,
      img.alt,
      true,
      img.width,
      imgHeight,
      widths,
    );
    accessHero.classList.add('hero-image');
    img.closest('picture')?.replaceWith(accessHero);
    return accessHero;
  }
  return null;
};

const mainCopy = (video) => {
  const heroCopy = video.querySelectorAll('h1, h2');
  if (heroCopy.length > 0) {
    const copyDiv = document.createElement('div');
    copyDiv.classList.add('hero-copy');
    heroCopy.forEach((el) => copyDiv.appendChild(el));
    video.appendChild(copyDiv);
  }
  const img = video.querySelector('picture img');
  if (img) {
    img.classList.add('hero-image');
  }
};

export default async function decorate(block) {
  const placeholder = block.querySelector('picture');
  const link = block.querySelector('a')?.href;
  if (!link || !link.includes('vimeo.com')) return;

  block.textContent = '';
  block.dataset.embedLoaded = false;

  const autoplay = block.classList.contains('autoplay');
  if (placeholder) {
    block.classList.add('placeholder');
    const wrapper = document.createElement('div');
    wrapper.className = 'video-placeholder';
    wrapper.append(placeholder);

    if (!autoplay) {
      wrapper.insertAdjacentHTML(
        'beforeend',
        '<div class="video-placeholder-play"><button type="button" title="Play"></button></div>',
      );
      wrapper.addEventListener('click', () => {
        wrapper.remove();
        loadVideoEmbed(block, link, true, false);
      });
    }
    block.append(wrapper);
  }

  if (!placeholder || autoplay) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        const playOnLoad = autoplay && !prefersReducedMotion.matches;
        loadVideoEmbed(block, link, playOnLoad, autoplay);
      }
    });
    observer.observe(block);
  }

  const video = block.querySelector(':scope > div');
  if (!video) return;

  addPlayButton(video, link);
  createButtonRow(video);
  mainCopy(video);
  optimizeHero(video);
  await decorateIcons(video);
}
