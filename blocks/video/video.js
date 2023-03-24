import { createOptimizedPicture, decorateIcons, loadCSS } from '../../scripts/lib-franklin.js';

let playerCssLoaded = false;

const CSS_CLASS_NAME_ICON = 'icon';
const CSS_CLASS_NAME_ICON_PLAY_VIDEO = 'icon-playvideo';
const HTML_PLAY_ICON = '<svg xmlns="http://www.w3.org/2000/svg"><use href="#icons-sprite-playvideo"></use></svg>';

const getVideoPathFromVideo = (video) => {
  const videoURLElement = video.querySelector(':scope > div:nth-child(2) a');
  if (!videoURLElement) {
    return '';
  }

  const videoURLString = videoURLElement.href;
  if (!videoURLString) {
    return '';
  }

  const watchMode = '/watch?v=';
  const watchIndex = videoURLString.indexOf(watchMode);

  if (watchIndex > 0) {
    return `/${videoURLString.substring(watchIndex + watchMode.length)}`;
  }

  return new URL(videoURLString).pathname;
};

const onPlayerCssLoaded = () => {
  playerCssLoaded = true;
};

const ensurePlayerCSSLoaded = () => {
  if (!playerCssLoaded) {
    loadCSS(`${window.hlx.codeBasePath}/blocks/video/player.css`, onPlayerCssLoaded);
  }
};

const loadVideo = (video, videoPath) => {
  ensurePlayerCSSLoaded();

  const videoIframe = document.createElement('iframe');
  videoIframe.classList.add('video-player-iframe');
  videoIframe.setAttribute('allowfullscreen', '');
  videoIframe.src = `https://www.youtube.com/embed${videoPath}`;

  video.appendChild(videoIframe);
};

const addPlayButton = (video) => {
  const playButton = document.createElement('span');
  playButton.classList.add(CSS_CLASS_NAME_ICON);
  playButton.classList.add(CSS_CLASS_NAME_ICON_PLAY_VIDEO);
  playButton.innerHTML = HTML_PLAY_ICON;

  video.appendChild(playButton);
};

const addClickHandler = (video, videoPath) => {
  video.addEventListener('click', () => loadVideo(video, videoPath), { passive: true });
};

const optimizeThumbnails = (video) => {
  video
    .querySelectorAll('img')
    .forEach((img) => {
      img
        .closest('picture')
        .replaceWith(
          createOptimizedPicture(
            img.src,
            img.alt,
            false,
            null,
            null,
            [{ width: '768' }],
          ),
        );
    });
};

const decorateVideo = async (video) => {
  const videoPath = getVideoPathFromVideo(video);
  if (!videoPath) {
    return;
  }

  addPlayButton(video);
  addClickHandler(video, videoPath);
  optimizeThumbnails(video);
  await decorateIcons(video);
};

export default async function decorate(block) {
  const videos = block.querySelectorAll(':scope > div');
  const promises = [];

  videos.forEach((video) => {
    promises.push(decorateVideo(video));
  });

  await Promise.all(promises);
}
