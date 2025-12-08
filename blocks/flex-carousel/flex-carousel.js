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
    return null;
  }

  const slide = document.createElement('div');
  slide.classList.add('flex-slide');

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

  const textContainer = document.createElement('div');
  textContainer.classList.add('flex-slide-text');
  textContainer.innerHTML = textCell.innerHTML;

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
  const carouselWrapper = document.createElement('div');
  carouselWrapper.classList.add('flex-carousel-wrapper');

  const sliderContainer = document.createElement('div');
  sliderContainer.classList.add('flex-slider-container');

  rows.forEach((row) => {
    const slide = createSlide(row);
    if (slide) {
      sliderContainer.appendChild(slide);
    }
  });

  block.innerHTML = '';
  carouselWrapper.appendChild(sliderContainer);
  block.appendChild(carouselWrapper);

  const carousel = new Carousel(sliderContainer);
  carousel.createSlideSlider();
  carousel.setSliderIds();

  if (carousel.hasSlides()) {
    carousel.createArrowNav(carouselWrapper);
    carousel.createDottedNav();
    carousel.initSlider();
    if (carousel.getSlides().length > 1) {
      carouselWrapper.addEventListener('mouseover', () => carousel.stopSlideShow());
      carouselWrapper.addEventListener('mouseleave', () => carousel.startSlideShow());
    }
  }
}

export default function decorate(block) {
  const rows = Array.from(block.children);

  if (rows.length === 0) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          initializeCarousel(block, rows);
          observer.unobserve(block);
        }
      });
    },
    {
      threshold: 0,
    },
  );

  observer.observe(block);
}
