import Carousel from '../../scripts/lib-carousel.js';
import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

/**
 * Add DIV around LI inner text to ensure text is displayed properly
 * @param block
 */
export function addEnclosingDiv(block) {
  const listItems = block.querySelectorAll('.carousel > div > div > ul li');
  listItems.forEach((el) => {
    const li = el.innerHTML;
    el.innerHTML = '';
    el.innerHTML = `<div>${li}</div>`;
  });
}

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

  const carousel = new Carousel(block.firstElementChild.lastElementChild);
  carousel.createPictureSlider();
  carousel.setSliderIds();

  if (carousel.sliderIds.length > 1) {
    carousel.createArrowNav();
    carousel.createDottedNav();
    carousel.initSlider();
  }
}
