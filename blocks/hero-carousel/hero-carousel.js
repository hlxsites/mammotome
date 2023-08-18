import Carousel from '../../scripts/lib-carousel.js';
import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

// Number of required columns in table
const NUM_COLUMNS = 3;
const INVALID_CONFIGURATION_MESSAGE = `Invalid configuration. Table with ${NUM_COLUMNS} columns and at least 1 row required`;

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
 * create button links as part of the text
 * @param slides
 */
export function createButtonRow(slides) {
  slides.forEach((slide) => {
    const buttons = slide.querySelectorAll('.button-container');
    if (buttons.length > 0) {
      const buttonRow = document.createElement('div');
      buttonRow.classList.add('button-row');
      buttons.forEach((button, i) => {
        button.remove();
        if (i % 2 === 1) {
          button.querySelector('a').classList.add('button', 'secondary');
        }
        buttonRow.appendChild(button);
      });
      slide.firstElementChild.appendChild(buttonRow);
    }
  });
}

/**
 * Check if align property has a valid value (left,right,center)
 * @param str
 * @returns {*}
 */
const checkAlign = (str) => str.includes('left') || str.includes('center') || str.includes('right');

/**
 * Get configuration from table containing align property and remove after parsing
 * @param block
 * @returns {*[]}: config array literal
 */
function getConfig(block) {
  if (block.children.length === 0 || block.children[0].children.length !== NUM_COLUMNS) {
    throw new Error(INVALID_CONFIGURATION_MESSAGE);
  }

  return Array.from(block.children).map((slide) => {
    const alignValue = slide.children[1].innerText.replace(/[\n\s]/g, '');
    const align = checkAlign(alignValue) ? alignValue : 'left';
    const imgAlign = align === 'center' || align === 'right' ? 'left' : 'right';
    slide.children[1].remove();
    return {
      align,
      imgAlign,
    };
  });
}

/**
 * Decorate hero-carousel block
 * @param block
 */
export default function decorate(block) {
  let config;
  try {
    config = getConfig(block);
  } catch (e) {
    block.innerHTML = `<code>${e.message}</code>`;
    return;
  }
  // check if required amount of columns and rows are present
  if (config.length === 0) {
    block.innerHTML = `<code>${INVALID_CONFIGURATION_MESSAGE}</code>`;
    return;
  }
  // Optimize images
  optimizeThumbnails(block);
  // Add white-overlay, position text and image to each slide
  Array.from(block.children).forEach((slide, i) => {
    slide.classList.add(`text-align-${config[i].align}`);
    slide.appendChild(Object.assign(document.createElement('div'), { className: 'white-overlay' }));
    slide.querySelector('img').classList.add(`position-${config[i].imgAlign}`);
  });

  // setup carousel and slider elements
  const heroCarousel = new Carousel(block);
  heroCarousel.createSlideSlider();
  heroCarousel.setSliderIds();
  // createButtonRow(heroCarousel.sliderChildren);
  createButtonRow(heroCarousel.getSlides());
  if (heroCarousel.getSlides().length > 1) {
    heroCarousel.createDottedNav();
    heroCarousel.setSliderInterval(4000);
    heroCarousel.initSlider();
  }
}
