import { createOptimizedPicture, decorateIcons, loadCSS } from '../../scripts/lib-franklin.js';

let playerCssLoaded = false;
let removeVideo;
let escHandler;

const CSS_CLASS_NAME_ICON_PLAY_VIDEO = 'icon-playvideo';
const HTML_PLAY_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="99.2px" height="99.2px">\n'
  + '    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>\n'
  + '    <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>\n'
  + '</svg>';
const YOUTUBE_URL_REGEX = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;

const getVideoURL = (video) => {
  const videoURLElement = video.querySelector('a');
  videoURLElement.classList.add('hero-video');
  if (!videoURLElement) {
    return '';
  }
  const videoURLString = videoURLElement.href;
  if (!videoURLString) {
    return '';
  }

  const matchURL = videoURLString.match(YOUTUBE_URL_REGEX);
  const videoCode = matchURL && matchURL[7];

  if (videoCode && videoCode.length === 11) {
    return `/${videoCode}`;
  }

  return new URL(videoURLString).pathname;
};

const onPlayerCssLoaded = () => {
  playerCssLoaded = true;
};

const ensurePlayerCSSLoaded = () => {
  if (!playerCssLoaded) {
    loadCSS(`${window.hlx.codeBasePath}/blocks/video/asset-viewer/asset-viewer.css`, onPlayerCssLoaded);
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

const loadVideo = (video, videoPath) => {
  ensurePlayerCSSLoaded();

  const main = document.querySelector('main');

  const overlays = createVideoOverlays(main);

  const videoIframe = document.createElement('iframe');
  videoIframe.classList.add('video-player-iframe');
  videoIframe.setAttribute('allowfullscreen', '');
  videoIframe.src = `https://www.youtube.com/embed${videoPath}`;

  main.prepend(videoIframe);

  registerEventListeners(main, overlays, videoIframe);
};

const addPlayButton = (video, videoPath) => {
  const playButton = document.createElement('span');
  playButton.classList.add(CSS_CLASS_NAME_ICON_PLAY_VIDEO);
  playButton.innerHTML = HTML_PLAY_ICON;

  playButton.dataset.videoUrl = videoPath;

  playButton.addEventListener('click', (e) => {
    e.stopPropagation();
    loadVideo(video, videoPath);
  });

  const img = video.querySelector('picture');
  if (img && img.parentNode) {
    img.parentNode.appendChild(playButton);
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
  const video = block.querySelector(':scope > div');
  if (!video) return;

  const videoPath = getVideoURL(video);
  if (!videoPath) return;

  addPlayButton(video, videoPath);
  mainCopy(video);
  optimizeHero(video);
  await decorateIcons(video);
}
