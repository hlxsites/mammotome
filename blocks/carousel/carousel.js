import {
  addEnclosingDiv,
  createSliderWrapper,
  setSliderIds,
  createDottedNav,
  initSlider,
  createPictures,
  createArrowNav,
} from '../../scripts/lib-carousel.js';
import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

/**
 * Get optimized img element width default
 * @param picture
 */
export function optimizeThumbnails(picture) {
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
}

export default function decorate(block) {
  optimizeThumbnails(block);
  addEnclosingDiv(block);

  const sliderWrapper = createSliderWrapper(block.firstElementChild.lastElementChild);
  const slider = createPictures(sliderWrapper);
  const slides = setSliderIds(slider);
  if (slides.length > 1) {
    const arrowNav = createArrowNav();
    slider.appendChild(arrowNav);

    const dottedNavContainer = createDottedNav(slides);
    sliderWrapper.appendChild(dottedNavContainer);

    initSlider(slides.length);
  }
}
