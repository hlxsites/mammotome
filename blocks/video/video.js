import { loadCSS } from '../../scripts/lib-franklin.js';

const getPathNameFromYoutubeURL = (videoURLString) => {
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

const loadVideo = (video) => {
  const videoURLElement = video.querySelector(':scope > div:first-child');
  const videoURLString = videoURLElement.textContent;

  if (!videoURLString) {
    return;
  }

  const videoIframe = document.createElement('iframe');
  videoIframe.classList.add('video-player-iframe');
  videoIframe.setAttribute('allowfullscreen', '');
  videoIframe.src = `https://www.youtube.com/embed${getPathNameFromYoutubeURL(videoURLString)}`;

  // const description = video.querySelector(':scope > div:last-child').textContent;

  loadCSS(`${window.hlx.codeBasePath}/blocks/video/player.css`, null);

  videoURLElement.replaceWith(videoIframe);
};

export default async function decorate(block) {
  const videos = block.querySelectorAll(':scope > div');
  videos.forEach((video) => {
    video.addEventListener('click', () => loadVideo(video));
  });
  // const videoURL = new URL(block.getElementsByTagName('a')[0].innerText);
  // block.addEventListener('click', () => loadVideo(videoURL, block));
}
