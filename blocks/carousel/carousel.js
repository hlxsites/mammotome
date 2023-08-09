import {
  addEnclosingDiv,
  createSliderWrapper,
  setSliderIds,
  createDottedNav,
  initSlider,
  createPictureSlider,
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
            true,
            img.width,
            img.height,
            [{ width: '768' }],
          ),
        );
    });
}

export default function decorate(block) {
  optimizeThumbnails(block);
  addEnclosingDiv(block);

  const sliderWrapper = createSliderWrapper(block.firstElementChild.lastElementChild);
  const slider = createPictureSlider();
  const slides = setSliderIds();
  if (slides.length > 1) {
    const arrowNav = createArrowNav();
    slider.appendChild(arrowNav);

    const dottedNavContainer = createDottedNav();
    sliderWrapper.appendChild(dottedNavContainer);

    initSlider();
  }
}
