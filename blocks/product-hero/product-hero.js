import { decorateIcons } from '../../scripts/lib-franklin.js';
import { preloadLCPImage } from '../../scripts/scripts.js';

function decorateTeaserPicture(teaserPicture, target) {
  teaserPicture.parentElement.classList.add('video-cover');
  target.appendChild(teaserPicture.parentElement);
}

const YOUTUBE_URL_REGEX = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;

const getYouTubePath = (video) => {
  const videoPath = video.includes('youtube.com');
  if (!videoPath) {
    return '';
  }

  const videoURLString = videoPath.href;
  if (!videoURLString) {
    return '';
  }

  const matchUrl = videoURLString.match(YOUTUBE_URL_REGEX);
  const videoCode = matchUrl && matchUrl[7];

  if (videoCode && videoCode.length === 11) {
    return `/${videoCode}`;
  }

  return new URL(videoURLString).pathname;
};

function playVideoAnimation(e) {
  const [playIcon] = e.target
    .closest('.hero-video')
    .querySelectorAll('.play-pause-fullscreen-button svg');

  playIcon.style.opacity = 1;
  setTimeout(() => {
    playIcon.style.opacity = 0;
  }, 400);
}

function pauseVideoAnimation(e) {
  const [, pauseIcon] = e.target
    .closest('.hero-video')
    .querySelectorAll('.play-pause-fullscreen-button svg');

  pauseIcon.style.opacity = 1;
  setTimeout(() => {
    pauseIcon.style.opacity = 0;
  }, 400);
}

function decorateTeaser(video, teaserPicture, target) {
  if (!video && !teaserPicture) {
    // nothing to decorate
    return;
  }

  if (!video) {
    // author didn't configure a teaser video
    // we'll use the image as the hero content for all screen sizes
    teaserPicture.style.setProperty('display', 'block', 'important');
    decorateTeaserPicture(teaserPicture, target);
    return;
  }

  const loadVideo = (video, videoPath) => {
    const videoIframe = document.createElement('iframe');
    if (!teaserPicture) {
    // author didn't configure a teaser picture
    // we'll use the video for all screen sizes
      videoIframe.style.setProperty('display', 'block', 'important');
    } else {
      videoIframe.setAttribute('poster', teaserPicture.currentSrc);
      decorateTeaserPicture(teaserPicture, target);
    }

    videoIframe.classList.add('video-cover', 'video-player-iframe');
    videoIframe.toggleAttribute('muted', true);
    videoIframe.toggleAttribute('loop', true);
    videoIframe.setAttribute('title', video.title);
    videoIframe.src = `https://www.youtube.com/embed${videoPath}`;

    const mql = window.matchMedia('only screen and (max-width: 768px)');
    if (mql.matches && teaserPicture) {
      videoIframe.setAttribute('preload', 'metadata');
    } else {
      videoIframe.toggleAttribute('autoplay', true);
    }

    mql.onchange = (e) => {
      if (!e.matches && !videoIframe.hasAttribute('autoplay')) {
        videoIframe.toggleAttribute('autoplay', true);
        videoIframe.play();
      }
    };

    videoIframe.innerHTML = `<source src="${video.href}" type="video/mp4">`;
    target.prepend(videoIframe);
    videoIframe.muted = true;
    video.remove();
  };
}
function decorateOverlayButton(fullScreenVideoLink, block, overlay) {
  const button = document.createElement('button');
  button.classList.add('video-banner-btn');

  button.innerHTML = fullScreenVideoLink.innerHTML;

  button.addEventListener('click', () => {
    const fullVideoContainer = block.querySelector('.full-video-container');
    fullVideoContainer.style.display = 'block';
    const video = fullVideoContainer.querySelector('video');
    video.play();
    setTimeout(() => {
      video.addEventListener('play', playVideoAnimation);
      video.addEventListener('pause', pauseVideoAnimation);
    });
  });

  overlay.appendChild(button);
  fullScreenVideoLink.remove();
}

function createIcons(target, iconNames) {
  iconNames.forEach((iconName) => {
    const icon = document.createElement('span');
    icon.classList.add('icon');
    icon.classList.add(`icon-${iconName}`);

    target.appendChild(icon);
  });

  decorateIcons(target);
}

function toggleVideoPlay(video) {
  if (video.paused) {
    video.play();
  } else {
    video.pause();
  }
}

async function decorateFullScreenVideo(fullScreenVideoLink, teaserPicture, target) {
  const fullVideoContainer = document.createElement('div');
  fullVideoContainer.classList.add('full-video-container');

  const video = document.createElement('video');
  video.classList.add('video-cover');
  video.innerHTML = `<source src="${fullScreenVideoLink}" type="video/mp4">`;
  video.setAttribute('preload', 'metadata');
  video.setAttribute('poster', teaserPicture.currentSrc);

  video.addEventListener('click', () => { toggleVideoPlay(video); });

  const closeVideoButton = document.createElement('div');
  closeVideoButton.classList.add('close-video');
  createIcons(closeVideoButton, ['close-video']);
  closeVideoButton.addEventListener('click', () => {
    video.removeEventListener('pause', pauseVideoAnimation);
    video.removeEventListener('play', playVideoAnimation);
    video.pause();
    video.currentTime = 0;
    video.load();
    fullVideoContainer.style.display = 'none';
  });

  const playPauseVideoButton = document.createElement('div');
  playPauseVideoButton.classList.add('play-pause-fullscreen-button');
  createIcons(playPauseVideoButton, ['full-screen-play', 'full-screen-pause']);
  playPauseVideoButton.addEventListener('click', () => { toggleVideoPlay(video); });

  fullVideoContainer.appendChild(closeVideoButton);
  fullVideoContainer.appendChild(playPauseVideoButton);
  fullVideoContainer.appendChild(video);
  target.appendChild(fullVideoContainer);
}

export default function decorate(block) {
  const videoBanner = block.children[0];
  videoBanner.classList.add('hero-video-banner');

  const heroContent = videoBanner.children[0];
  heroContent.classList.add('teaser-video-container');

  const teaserVideoLink = heroContent.querySelector('a');
  const teaserPicture = heroContent.querySelector('img');
  const placeholderImage = heroContent.querySelectorAll('picture')[1];

  if (placeholderImage) {
    placeholderImage.classList.add('placeholder-image');
    block.appendChild(placeholderImage);
  }

  preloadLCPImage(teaserPicture.src);
  decorateTeaser(teaserVideoLink, teaserPicture, heroContent, placeholderImage);

  const overlay = videoBanner.children[1];
  overlay.classList = 'overlay';

  const fullScreenVideoLink = overlay.querySelector('a:last-of-type');
  if (!fullScreenVideoLink) {
    return;
  }
  const fullScreenVideoLinkHref = fullScreenVideoLink.href;
  decorateOverlayButton(fullScreenVideoLink, block, overlay);
  decorateFullScreenVideo(fullScreenVideoLinkHref, teaserPicture, videoBanner);
}
