import { loadCSS, decorateIcons } from '../../scripts/lib-franklin.js';

let playerCssLoaded = false;
let removeVideo;
let escHandler;

const CSS_CLASS_NAME_ICON_PLAY_VIDEO = 'icon-playvideo';
const HTML_PLAY_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="99.2px" height="99.2px">\n'
  + '    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>\n'
  + '    <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>\n'
  + '</svg>';

const getVimeoLinks = (block) => {
  const links = Array.from(block.querySelectorAll('a'));
  let previewLink = '';
  let modalLink = '';

  links.forEach((link) => {
    const { href } = link;
    if (href.includes('vimeo.com/video/')) {
      if (!previewLink) previewLink = href;
      else if (!modalLink) modalLink = href;
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
  container.appendChild(Object.assign(document.createElement('div'), { className: 'white-overlay' }));
  const pageTitle = document.title;
  container.innerHTML = `
    <iframe src="${fullSrc}"
      style="position: absolute; width: 100%; height: 100%; top: 0; left: 0; border: none; object-fit: cover;"
      frameborder="0"
      allow="autoplay; fullscreen; picture-in-picture"
      allowfullscreen
      loading="lazy"
      title="${pageTitle}"
    ></iframe>
  `;
  return container;
};

const ensurePlayerCSSLoaded = () => {
  if (!playerCssLoaded) {
    loadCSS(`${window.hlx.codeBasePath}/blocks/video/asset-viewer/asset-viewer.css`, () => {
      playerCssLoaded = true;
    });
  }
};

const loadVideo = (block, videoLink) => {
  ensurePlayerCSSLoaded();

  const main = document.querySelector('main');
  const overlay = document.createElement('div');
  overlay.classList.add('asset-viewer-overlay');
  main.prepend(overlay);

  const toolbar = document.createElement('div');
  toolbar.classList.add('asset-viewer-toolbar');
  const close = document.createElement('div');
  close.classList.add('asset-viewer-close');
  toolbar.appendChild(close);
  main.prepend(toolbar);

  const url = new URL(videoLink);
  const params = new URLSearchParams(url.search);
  params.set('autoplay', '1');
  const fullSrc = `${url.origin}${url.pathname}?${params.toString()}`;

  const pageTitle = document.title;
  const iframe = document.createElement('iframe');
  iframe.className = 'video-player-iframe';
  iframe.src = fullSrc;
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
  iframe.setAttribute('title', `${pageTitle}`);
  main.prepend(iframe);

  removeVideo = () => {
    overlay.removeEventListener('click', removeVideo);
    close.removeEventListener('click', removeVideo);
    window.removeEventListener('keydown', escHandler);
    main.removeChild(overlay);
    main.removeChild(toolbar);
    main.removeChild(iframe);
  };

  escHandler = (e) => {
    if (e.key === 'Escape') removeVideo();
  };

  overlay.addEventListener('click', removeVideo);
  close.addEventListener('click', removeVideo);
  window.addEventListener('keydown', escHandler);
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

    if (video.children.length >= 2) {
      video.insertBefore(buttonRow, video.children[2]);
    } else {
      video.appendChild(buttonRow);
    }
  }
};

export default async function decorate(block) {
  const { previewLink, modalLink } = getVimeoLinks(block);
  if (!previewLink) return;

  const previewBg = buildVimeoBackground(previewLink);
  block.prepend(previewBg);

  if (modalLink) {
    const playBtn = document.createElement('span');
    playBtn.className = CSS_CLASS_NAME_ICON_PLAY_VIDEO;
    playBtn.innerHTML = HTML_PLAY_ICON;
    playBtn.addEventListener('click', () => loadVideo(block, modalLink));
    block.append(playBtn);
  }

  mainCopy(block);
  createButtonRow(block);
  await decorateIcons(block);
}
