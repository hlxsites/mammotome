import {
  addEnclosingDiv,
  createSlideSlider,
  createSliderWrapper,
  initSlider,
  getSliderChildren,
  setSlideDuration,
  createArrowNav,
  setLeftAndRightArrowHtml,
} from '../../scripts/lib-carousel.js';
import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

// Number of required columns in table
const NUM_COLUMNS = 2;
const INVALID_CONFIGURATION_MESSAGE = `Invalid configuration. Table with ${NUM_COLUMNS} columns and at least 1 row required`;

const HTML_LEFT_ARROW = '<svg fill="rgb(88,127,194)" width="24px" height="24px" viewBox="0 0 1024 1024" class="icon"  xmlns="http://www.w3.org/2000/svg">'
  + '<path d="M768 903.232l-50.432 56.768L256 512l461.568-448 50.432 56.768L364.928 512z"/>'
  + '</svg>';

const HTML_RIGHT_ARROW = '<svg fill="rgb(88,127,194)" width="24px" height="24px" viewBox="0 0 1024 1024" class="icon"  xmlns="http://www.w3.org/2000/svg">'
  + '<path d="M256 120.768L306.432 64 768 512l-461.568 448L256 903.232 659.072 512z"/>'
  + '</svg>';

/**
 * Get optimized img element width default
 * @param picture
 */
export function optimizeThumbnails(picture) {
  picture
    .querySelectorAll('img')
    .forEach((img) => {
      const imgHeight = Math.floor((img.height * 1024) / img.width);
      img
        .closest('picture')
        .replaceWith(
          createOptimizedPicture(
            img.src,
            'Slider Image',
            true,
            img.width,
            imgHeight,
          ),
        );
    });
}

function checkConfig(block) {
  if (block.children.length === 0 || block.children[0].children.length !== NUM_COLUMNS) {
    throw new Error(INVALID_CONFIGURATION_MESSAGE);
  }
}

/**
 * Move Elements in an array to the right
 * by removing the first element and adding it to the end
 * @param arr
 * @returns {*}
 */
function moveArrayRight(arr) {
  if (arr.length < 2) {
    return arr;
  }

  const firstItem = arr.shift();
  arr.push(firstItem);

  return arr;
}

/**
 * Move Elements in an array to the left
 * by removing the last element and adding it to the beginning
 * @param arr
 * @returns {*}
 */
function moveArrayLeft(arr) {
  if (arr.length < 2) {
    return arr;
  }

  const lastItem = arr.pop();
  arr.unshift(lastItem);

  return arr;
}

const arrowNavigation = (event) => {
  const navButton = event.currentTarget.id;
  const direction = navButton === 'slider-arrow-left' ? -1 : 1;
  const sliderChildren = getSliderChildren();
  // const slider = document.querySelector('.slider');
  const newSliderChildren = direction === 1
    ? moveArrayRight(sliderChildren)
    : moveArrayLeft(sliderChildren);
  // Reorder slider in grid. First 3 slides are visible, the rest are hidden
  newSliderChildren.forEach((child, i) => {
    const showSlide = i + 1 <= 3 ? 'display: unset;' : 'display: none;';
    const slideIndex = i + 1 === 2 ? 'z-index: 3;' : 'z-index: 1;';
    child.setAttribute('style', `order: ${i + 1};${showSlide}${slideIndex}`);
  });
};

/**
 * Event Listeners for arrow navigation
 */
const arrowNavOnClickEvents = (arrowNavContainer) => {
  if (arrowNavContainer) {
    Array.from(arrowNavContainer.children).forEach((el) => {
      el.addEventListener('click', (event) => {
        arrowNavigation(event);
      });
    });
  }
};

export default function decorate(block) {
  try {
    checkConfig(block);
  } catch (e) {
    block.innerHTML = `<code>${e.message}</code>`;
  }

  optimizeThumbnails(block);
  addEnclosingDiv(block);
  block.querySelectorAll('.button-container').forEach((el) => {
    el.classList.remove('button-container');
  });
  block.querySelectorAll('.button').forEach((el) => {
    el.classList.remove('button', 'primary');
  });
  setLeftAndRightArrowHtml(HTML_LEFT_ARROW, HTML_RIGHT_ARROW);
  const sliderWrapper = createSliderWrapper(block);
  createSlideSlider();
  const arrowNavContainer = createArrowNav();
  setSlideDuration(0);
  sliderWrapper.appendChild(arrowNavContainer);
  initSlider(false, false, false);
  arrowNavOnClickEvents(arrowNavContainer);
}
