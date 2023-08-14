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
const NUM_ROWS = 3;
const INVALID_NUMBER_OF_COLUMNS_MESSAGE = `Invalid configuration. Table with ${NUM_COLUMNS} columns and at least 1 row required`;
const INVALID_NUMBER_OF_ROWS_MESSAGE = `Invalid configuration. At least ${NUM_ROWS} rows required to properly show the Product Carousel`;

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

/**
 * Check if the block has the correct number of columns and rows
 * @param block
 */
function checkConfig(block) {
  if (block.children.length === 0 || block.children[0].children.length < NUM_COLUMNS) {
    throw new Error(INVALID_NUMBER_OF_COLUMNS_MESSAGE);
  }
  if (block.children.length < NUM_ROWS) {
    throw new Error(INVALID_NUMBER_OF_ROWS_MESSAGE);
  }
}

/**
 * Move Elements in an array by a given number of positions.
 * Positive numPositions value moves elements to the right,
 * negative numPositions value moves elements to the left.
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
    let i = 0;
    while (i < normalizedPositions) {
      const lastItem = arr.pop();
      arr.unshift(lastItem);
      i += 1;
    }
  } else {
    let i = 0;
    while (i > normalizedPositions) {
      const firstItem = arr.shift();
      arr.push(firstItem);
      i -= 1;
    }
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
  const showSlide = index < 3 ? 'unset' : 'none';
  const slideIndex = index === 1 ? 3 : 1;
  child.style.cssText = `order: ${index + 1}; display: ${showSlide}; z-index: ${slideIndex};`;
};

/**
 * Navigation for arrow buttons.
 * @param {Event} event - The event object.
 * @returns {void}
 */
const arrowNavigation = (event) => {
  const sliderChildren = getSliderChildren();
  const direction = event.currentTarget.id === 'slider-arrow-left' ? 1 : -1;
  const newSliderChildren = moveArrayElements(sliderChildren, direction);

  newSliderChildren.forEach(updateChildStyle);
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

/**
 * Initialize the slide order
 * @param sliderChildren
 */
const initSlideOrder = (sliderChildren) => {
  sliderChildren.forEach((child, index) => {
    child.setAttribute('style', `order: ${index + 1};`);
  });
};

/**
 * Decorate the block
 * @param block
 */
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
  const sliderChildren = getSliderChildren();
  initSlideOrder(sliderChildren);
  const arrowNavContainer = createArrowNav();
  setSlideDuration(0);
  sliderWrapper.appendChild(arrowNavContainer);
  initSlider(false, false, false);
  arrowNavOnClickEvents(arrowNavContainer);
}
