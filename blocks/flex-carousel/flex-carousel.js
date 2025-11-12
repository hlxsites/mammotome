import Carousel from '../../scripts/lib-carousel.js';
import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

/**
 * Get optimized img element
 * @param img - image element
 * @returns {Element} - optimized picture element
 */
export function optimizeImage(img) {
  return createOptimizedPicture(img.src, img.alt, true, img.width, img.height, [
    { width: '768' },
  ]);
}

/**
 * Create a slide element from a row (image, text, alignment)
 * @param row - table row with 3 columns
 * @returns {HTMLDivElement} - slide element
 */
function createSlide(row) {
  const cells = row.querySelectorAll(':scope > div');

  if (cells.length < 2) {
    return null;
  }

  const imageCell = cells[0];
  const textCell = cells[1];
  const alignmentCell = cells[2];

  // Get alignment (default to 'left' if not specified)
  const alignment = alignmentCell?.textContent?.trim().toLowerCase() || 'left';

  // Create slide container
  const slide = document.createElement('div');
  slide.classList.add('flex-slide');

  // Create image container
  const imageContainer = document.createElement('div');
  imageContainer.classList.add('flex-slide-image');

  const img = imageCell.querySelector('img');
  if (img) {
    const optimizedPicture = optimizeImage(img);
    imageContainer.appendChild(optimizedPicture);
  } else {
    const picture = imageCell.querySelector('picture');
    if (picture) {
      imageContainer.appendChild(picture);
    }
  }

  // Create text container
  const textContainer = document.createElement('div');
  textContainer.classList.add('flex-slide-text');
  textContainer.innerHTML = textCell.innerHTML;

  // Apply alignment
  if (alignment === 'right') {
    slide.classList.add('align-right');
    slide.appendChild(textContainer);
    slide.appendChild(imageContainer);
  } else {
    slide.classList.add('align-left');
    slide.appendChild(imageContainer);
    slide.appendChild(textContainer);
  }

  return slide;
}

export default function decorate(block) {
  // Get all rows from the block
  const rows = Array.from(block.children);

  if (rows.length === 0) {
    return;
  }

  // Create wrapper for carousel
  const carouselWrapper = document.createElement('div');
  carouselWrapper.classList.add('flex-carousel-wrapper');

  // Create slider container
  const sliderContainer = document.createElement('div');
  sliderContainer.classList.add('flex-slider-container');

  // Convert each row to a slide
  rows.forEach((row) => {
    const slide = createSlide(row);
    if (slide) {
      sliderContainer.appendChild(slide);
    }
  });

  // Clear the block and add the carousel wrapper
  block.innerHTML = '';
  carouselWrapper.appendChild(sliderContainer);
  block.appendChild(carouselWrapper);

  // Initialize carousel
  const carousel = new Carousel(sliderContainer);
  carousel.createSlideSlider();
  carousel.setSliderIds();

  if (carousel.hasSlides()) {
    // Create arrow navigation on the carousel wrapper instead of slider container
    carousel.createArrowNav(carouselWrapper);
    carousel.createDottedNav();
    carousel.initSlider();
  }
}
