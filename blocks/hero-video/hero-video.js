import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

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

// take input for placeholder image or placeholder video
// create an arrow button overlay over placeholder
const addPlayButton = (video) => {
  const playButton = document.createElement('span');
  playButton.classList.add(CSS_CLASS_NAME_ICON_PLAY_VIDEO);
  playButton.innerHTML = HTML_PLAY_ICON;
};

// video play function; listen for click on icon-playvideo
// expand video
// add overlays for exit/etc
// take in the user text: header > subtitle
// pull from database for buttons

export default async function decorate(block) {
  const heroImg = block.querySelector('picture');
  if (heroImg) heroImg.classList.add('hero-image');
  const videoLink = block.querySelector('a');

  const header = block.querySelector('h1, .hero-header, header');
  const subtitle = block.querySelector('h2, .hero-subtitle, .subtitle');
  const content = document.createElement('div');
  content.className = 'hero-content';
  if (header) content.appendChild(header.cloneNode(true));
  if (subtitle) content.appendChild(subtitle.cloneNode(true));

  block.textContent = '';
  if (heroImg) block.appendChild(heroImg);
  if (content.childNodes.length) block.appendChild(content);

  block.dataset.embedLoaded = false;
  addPlayButton(block, videoLink);

  // Optionally, add video click handler here if needed
}
