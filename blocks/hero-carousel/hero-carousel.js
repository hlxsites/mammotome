import {
  addEnclosingDiv,
  createSliderWrapper,
  createSlider,
  setSliderIds,
  createButtonRow,
  createDottedNav,
  initSlider,
} from '../../scripts/lib-carousel.js';
import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

/**
 * Optimize thumbnails
 * @param picture
 */
const optimizeThumbnails = (picture) => {
  picture
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

function parseData(data) {
  return data.replace(/[\n\s]/g, '');
}

/**
 * Get configuration from table containing align property and remove after parsing
 * @param block
 * @returns {*[]}: config array literal
 */
function getConfig(block) {
  const checkAlign = (str) => str.includes('left') || str.includes('center') || str.includes('right');

  const slides = block.children;
  const config = [];
  if (slides.length === 0 || slides[0].children.length !== 3) return config;
  [...slides].forEach((slide) => {
    const alignValue = parseData(slide.children[1].innerText);
    const align = checkAlign(alignValue) ? alignValue : 'left';
    const configItem = {
      align,
    };
    config.push(configItem);
    slide.children[1].remove();
  });
  return config;
}

export default function decorate(block) {
  const config = getConfig(block);
  // check if required amount of columns and rows are present
  if (config.length === 0) {
    block.innerHTML = '<code>Invalid configuration. '
      + 'Table with 3 columns and at least 1 row required</code>';
    return;
  }
  // Add white-overlay container to each slide
  const slideContainer = block.children;
  [...slideContainer].forEach((slide, i) => {
    slide.setAttribute('style', `justify-content: ${config[i].align};`);
    const overlay = document.createElement('div');
    overlay.classList.add('white-overlay');
    slide.appendChild(overlay);
  });

  optimizeThumbnails(block);
  addEnclosingDiv(block);
  // setup carousel and slider elements
  const sliderWrapper = createSliderWrapper(block);
  const slider = createSlider(sliderWrapper);
  const slides = setSliderIds(slider);
  createButtonRow(sliderWrapper.querySelectorAll('.slider > div'));
  if (slides.length > 1) {
    const dottedNavContainer = createDottedNav(slides);
    sliderWrapper.appendChild(dottedNavContainer);
    initSlider(slides.length);
  }
}
