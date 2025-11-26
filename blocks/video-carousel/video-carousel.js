import Carousel from '../../scripts/lib-carousel.js';
import {
  createOptimizedPicture,
  decorateIcons,
  loadCSS,
} from '../../scripts/lib-franklin.js';

let playerCssLoaded = false;
let removeVideo;
let escHandler;

const LARGE_SCREEN = 1000;

const CSS_CLASS_NAME_ICON_PLAY_VIDEO = 'icon-playvideo';
const HTML_PLAY_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="99.2px" height="99.2px">\n'
  + '    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>\n'
  + '    <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>\n'
  + '</svg>';
const YOUTUBE_URL_REGEX = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;

/**
 * Arrow SVGs for navigation (matching flex-carousel shape with video-carousel color)
 */
const HTML_LEFT_ARROW = '<svg fill="rgb(88,127,194)" xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 600 600">\n'
  + '<path d="M97.141,225.92c0-8.095,3.091-16.192,9.259-22.366L300.689,9.27c12.359-12.359,32.397-12.359,44.751,0c12.354,12.354,12.354,32.388,0,44.748L173.525,225.92l171.903,171.909c12.354,12.354,12.354,32.391,0,44.744c-12.354,12.365-32.386,12.365-44.745,0l-194.29-194.281C100.226,242.115,97.141,234.018,97.141,225.92z"/>\n'
  + '</svg>';
const HTML_RIGHT_ARROW = '<svg fill="rgb(88,127,194)" xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 600 600">\n'
  + '<path d="M194.287,9.27c12.359-12.359,32.391-12.359,44.75,0l194.287,194.284c6.177,6.18,9.262,14.271,9.262,22.366c0,8.095-3.091,16.192-9.259,22.366L239.037,442.573c-12.359,12.365-32.397,12.365-44.75,0c-12.354-12.354-12.354-32.391,0-44.744L366.201,225.92L194.287,54.017C181.933,41.658,181.933,21.623,194.287,9.27z"/>\n'
  + '</svg>\n';

const getVideoPathFromVideo = (video) => {
  const videoURLElement = video.querySelector(':scope > div:nth-child(2) a');
  if (!videoURLElement) {
    return '';
  }

  const videoURLString = videoURLElement.href;
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

const onPlayerCssLoaded = () => {
  playerCssLoaded = true;
};

const ensurePlayerCSSLoaded = () => {
  if (!playerCssLoaded) {
    loadCSS(
      `${window.hlx.codeBasePath}/blocks/video/asset-viewer/asset-viewer.css`,
      onPlayerCssLoaded,
    );
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

const addPlayButton = (video) => {
  const playButton = document.createElement('span');
  playButton.classList.add(CSS_CLASS_NAME_ICON_PLAY_VIDEO);
  playButton.innerHTML = HTML_PLAY_ICON;

  const thumbnailElement = video.querySelector(':scope > div:nth-child(3)');
  thumbnailElement.appendChild(playButton);
};

const addClickHandler = (video, videoPath) => {
  const thumbnailElement = video.querySelector(':scope > div:nth-child(3)');
  if (thumbnailElement) {
    thumbnailElement.addEventListener(
      'click',
      () => loadVideo(video, videoPath),
      {
        passive: true,
      },
    );
  }
};

/**
 * Optimize thumbnails for carousel display with fixed height for uniform appearance
 * @param block
 */
const optimizeThumbnails = (block) => {
  const THUMBNAIL_HEIGHT = 280; // Fixed height for all thumbnails
  block.querySelectorAll('img').forEach((img) => {
    img
      .closest('picture')
      ?.replaceWith(
        createOptimizedPicture(
          img.src,
          'Video Thumbnail',
          true,
          1024,
          THUMBNAIL_HEIGHT,
        ),
      );
  });
};

/**
 * Move Elements in an array by a given number of positions.
 * @param arr
 * @param numPositions
 * @returns {*}
 */
function moveArrayElements(arr, numPositions) {
  if (arr.length < 2) {
    return arr;
  }

  const normalizedPositions = numPositions % arr.length;
  if (normalizedPositions === 0) {
    return arr;
  }

  if (normalizedPositions > 0) {
    const movedElements = arr.splice(arr.length - normalizedPositions);
    arr.unshift(...movedElements);
  } else {
    const movedElements = arr.splice(0, -normalizedPositions);
    arr.push(...movedElements);
  }

  return arr;
}

/**
 * Updates the style properties of a slide child element.
 * @param {HTMLElement} child - The slide child element.
 * @param {number} index - The index of the element.
 * @returns {void}
 */
const updateChildStyle = (child, index) => {
  const showSlide = index < 3 ? 'flex' : 'none';
  const slideIndex = index === 1 ? 3 : 1;
  child.style.cssText = `order: ${
    index + 1
  }; display: ${showSlide}; z-index: ${slideIndex};`;
};

/**
 * Reorder the children of the slider and remove empty children for mobile view
 * @param videoCarousel
 * @returns {slideChildren}
 */
const reorderChildren = (videoCarousel) => {
  videoCarousel.sliderChildren = videoCarousel.sliderChildren.filter(
    (child) => child.innerHTML.trim() !== '',
  );

  videoCarousel.sliderChildren.forEach(updateChildStyle);
  return videoCarousel.sliderChildren;
};

/**
 * Navigation for arrow buttons.
 * @param {Event} event
 * @returns {void}
 */
const arrowNavigation = (videoCarousel, event) => {
  const isLargeScreen = window.innerWidth > LARGE_SCREEN;
  const sliderChildren = isLargeScreen
    ? videoCarousel.getSlides()
    : reorderChildren(videoCarousel);

  const increment = 1;
  const direction = event.currentTarget.id === 'slider-arrow-left' ? increment : -increment;

  moveArrayElements(sliderChildren, direction).forEach(updateChildStyle);
};

/**
 * Event Listeners for arrow navigation
 * @param videoCarousel
 */
const arrowNavOnClickEvents = (videoCarousel) => {
  if (videoCarousel.getArrowNavContainer()) {
    Array.from(videoCarousel.getArrowNavContainer().children).forEach((el) => {
      el.addEventListener('click', (event) => {
        arrowNavigation(videoCarousel, event);
      });
    });
  }
};

/**
 * Initialize the slide order
 * @param sliderChildren
 */
const initSlideOrder = (sliderChildren) => {
  sliderChildren.forEach((child, index) => {
    child.setAttribute('style', `order: ${index + 1};`);
  });
};

const fillSlideGrid = () => {
  // Empty function - placeholder for future implementation if needed
};

const decorateVideo = async (video) => {
  const videoPath = getVideoPathFromVideo(video);
  if (!videoPath) {
    return;
  }

  addPlayButton(video);
  addClickHandler(video, videoPath);
  await decorateIcons(video);
};

export default async function decorate(block) {
  block.classList.add('video-carousel');

  optimizeThumbnails(block);

  const videos = block.querySelectorAll(':scope > div');
  const promises = [];

  videos.forEach((video) => {
    promises.push(decorateVideo(video));
  });

  await Promise.all(promises);

  const videoCarousel = new Carousel(block);

  if (window.innerWidth > LARGE_SCREEN) fillSlideGrid(videoCarousel);

  videoCarousel.createSlideSlider();
  videoCarousel.setSliderIds();

  const slides = videoCarousel.getSlides();
  initSlideOrder(slides);
  slides.forEach(updateChildStyle);

  // Center videos when there are only 1 or 2 videos
  if (slides.length <= 2) {
    block.classList.add('video-carousel-centered');
    const slider = block.querySelector('.video-carousel-slider');
    if (slider) {
      slider.style.justifyContent = 'center';
      slider.style.gap = '20px';
    }
  }

  videoCarousel.setLeftAndRightArrowHtml(HTML_LEFT_ARROW, HTML_RIGHT_ARROW);

  if (slides.length > 1) videoCarousel.createArrowNav();

  videoCarousel.initSlider(false, false, false);

  if (slides.length > 1) arrowNavOnClickEvents(videoCarousel);
}
