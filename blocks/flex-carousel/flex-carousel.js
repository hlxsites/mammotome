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
 * Create a slide element from a row (image and text in any order)
 * @param row - table row with 2 columns
 * @returns {HTMLDivElement} - slide element
 */
function createSlide(row) {
  const cells = row.querySelectorAll(':scope > div');

  if (cells.length < 2) {
    return null;
  }

  const firstCell = cells[0];
  const secondCell = cells[1];

  // Determine which cell has the image
  const firstCellHasImage = firstCell.querySelector('img') || firstCell.querySelector('picture');
  const secondCellHasImage = secondCell.querySelector('img') || secondCell.querySelector('picture');

  let imageCell;
  let textCell;
  let imageOnLeft = true;

  if (firstCellHasImage) {
    imageCell = firstCell;
    textCell = secondCell;
    imageOnLeft = true;
  } else if (secondCellHasImage) {
    imageCell = secondCell;
    textCell = firstCell;
    imageOnLeft = false;
  } else {
    // No image found, skip this slide
    return null;
  }

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

  // Append elements in DOM order based on column position
  // Image in left column â†’ image renders left, text renders right
  // Image in right column â†’ text renders left, image renders right
  if (imageOnLeft) {
    slide.classList.add('image-left');
    slide.appendChild(imageContainer);
    slide.appendChild(textContainer);
  } else {
    slide.classList.add('image-right');
    slide.appendChild(textContainer);
    slide.appendChild(imageContainer);
  }

  return slide;
}

/**
 * Initialize the carousel when it enters the viewport
 * @param block - the carousel block
 * @param rows - array of carousel rows
 */
function initializeCarousel(block, rows) {
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

    // Add pause-on-hover functionality to the carousel wrapper
    // This ensures hovering anywhere over the carousel (including arrows) pauses it
    // Similar to hero-carousel behavior
    if (carousel.getSlides().length > 1) {
      carouselWrapper.addEventListener('mouseover', () => carousel.stopSlideShow());
      carouselWrapper.addEventListener('mouseleave', () => carousel.startSlideShow());
    }
  }
}

export default function decorate(block) {
  // Get all rows from the block
  const rows = Array.from(block.children);

  if (rows.length === 0) {
    return;
  }

  // Use Intersection Observer to initialize carousel when it enters viewport
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Block is now visible, initialize the carousel
          initializeCarousel(block, rows);
          // Stop observing after initialization
          observer.unobserve(block);
        }
      });
    },
    {
      // Trigger when block is 0% visible (as soon as it enters viewport)
      threshold: 0,
    },
  );

  observer.observe(block);
}
