import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

let activeSlide = 1;
let slideCount = 0;
let slideShow = false;

const HTML_ARROW_LEFT = '<svg fill="rgb(217, 217, 217)" xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 600 600">\n'
  + '<path d="M97.141,225.92c0-8.095,3.091-16.192,9.259-22.366L300.689,9.27c12.359-12.359,32.397-12.359,44.751,0c12.354,12.354,12.354,32.388,0,44.748L173.525,225.92l171.903,171.909c12.354,12.354,12.354,32.391,0,44.744c-12.354,12.365-32.386,12.365-44.745,0l-194.29-194.281C100.226,242.115,97.141,234.018,97.141,225.92z"/>\n'
  + '</svg>';
const HTML_ARROW_RIGHT = '<svg fill="rgb(217, 217, 217)" xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 600 600">\n'
  + '<path d="M345.441,248.292L151.154,442.573c-12.359,12.365-32.397,12.365-44.75,0c-12.354-12.354-12.354-32.391,0-44.744L278.318,225.92L106.409,54.017c-12.354-12.359-12.354-32.394,0-44.748c12.354-12.359,32.391-12.359,44.75,0l194.287,194.284c6.177,6.18,9.262,14.271,9.262,22.366C354.708,234.018,351.617,242.115,345.441,248.292z"/>\n'
  + '</svg>\n';

// Increment active slide value
const incrementActiveSlide = (direction = 1) => {
  if (direction > 0) {
    activeSlide = (activeSlide + 1) <= slideCount ? activeSlide + 1 : 1;
  } else {
    activeSlide = (activeSlide - 1) > 0 ? activeSlide - 1 : slideCount;
  }
};

// Activate/deactivate bottom bullets based
const activateBullet = (bulletId) => {
  const btnNav = document.querySelector('.bottom-nav');
  [...btnNav.children].forEach((el) => {
    if (el.id === bulletId) {
      el.classList.replace('inactive', 'active');
      el.setAttribute('aria-disabled', 'true');
      el.setAttribute('aria-current', 'true');
    } else {
      el.classList.replace('active', 'inactive');
      el.setAttribute('aria-disabled', 'false');
      el.setAttribute('aria-current', 'false');
    }
  });
};

// Slides picture switcher
const activateSlide = (targetPicture) => {
  const slider = document.querySelector('.slider');
  [...slider.children].forEach((el) => {
    if (el.id === targetPicture) {
      el.classList.replace('hide', 'show');
    } else {
      el.classList.replace('show', 'hide');
    }
  });
};

// Navigate with Bottom Bullet navigation
const bottomNavigation = (event) => {
  const targetId = parseInt(event.target.id.split('-')[2], 10);
  const sliderTarget = `slider-slide-${targetId}`;
  activateSlide(sliderTarget);
  activateBullet(event.target.id);
  incrementActiveSlide();
};

// Navigate with left and right for arrow navigation
const arrowNavigation = (event) => {
  const navButton = event.currentTarget.id;
  if (navButton === 'slider-arrow-left') {
    incrementActiveSlide(-1);
  } else if (navButton === 'slider-arrow-right') {
    incrementActiveSlide(1);
  }
  activateSlide(`slider-slide-${activeSlide}`);
  activateBullet(`slider-dot-${activeSlide}`);
};

/// Add event listners for bottom bullet nav
const bottomNavOnClickEvents = () => {
  const btnNav = document.querySelector('.bottom-nav');
  [...btnNav.children].forEach((el) => {
    el.addEventListener('click', bottomNavigation);
  });
};

// Event Listeners for arrow navigation
const arrowNavOnClickEvents = () => {
  const arrowNav = document.querySelector('.arrow-nav');
  [...arrowNav.children].forEach((el) => {
    el.addEventListener('click', arrowNavigation);
  });
};

// Control Slide show
const toNextSlide = () => {
  incrementActiveSlide(1);
  activateSlide(`slider-slide-${activeSlide}`);
  activateBullet(`slider-dot-${activeSlide}`);
};

// Start slide show
const startSlideShow = () => {
  if (!slideShow) {
    slideShow = window.setInterval(toNextSlide, 5000);
  }
};

// Stop automatic Slideshow
const stopSlideShow = () => {
  window.clearInterval(slideShow);
  slideShow = false;
};

// add Event Listener
const initSlider = () => {
  const sliderWrapper = document.querySelector('.slider-wrapper');
  sliderWrapper.addEventListener('mouseover', stopSlideShow);
  sliderWrapper.addEventListener('mouseleave', startSlideShow);
  startSlideShow();
  bottomNavOnClickEvents();
  arrowNavOnClickEvents();
};

// Set slide-wrapper class
const createSliderWrapper = (block) => {
  const sliderWrapper = block.firstElementChild.lastElementChild;
  sliderWrapper.classList.add('slider-wrapper');
  return sliderWrapper;
};

// put pictures under slider flex container
const createPictures = (sliderWrapper) => {
  const pictures = sliderWrapper.getElementsByTagName('picture');
  const slider = document.createElement('div');
  slider.classList.add('slider');
  [...pictures].forEach((el) => {
    slider.appendChild(el);
  });
  sliderWrapper.innerHTML = '';
  sliderWrapper.appendChild(slider);
  sliderWrapper.setAttribute('id', 'carousel');
  sliderWrapper.setAttribute('role', 'group');
  sliderWrapper.setAttribute('aria-label', 'Image Carousel');
  return slider;
};

// set picture id (slide 1 - n)
const setPictureIds = (slider) => {
  let i = 1;
  const slides = [];
  [...slider.children].forEach((el) => {
    el.setAttribute('id', `slider-slide-${i}`);
    el.classList.add(i === 1 ? 'show' : 'hide');
    slides.push(`slider-slide-${i}`);
    i += 1;
  });
  return slides;
};

// Create Arrow navigation
const createArrowNav = () => {
  const arrowNavContainer = document.createElement('div');
  arrowNavContainer.classList.add('arrow-nav');

  const arrowLeft = document.createElement('a');
  arrowLeft.setAttribute('id', 'slider-arrow-left');
  arrowLeft.setAttribute('aria-label', 'Previous Slide');
  arrowLeft.setAttribute('role', 'button');
  arrowLeft.innerHTML = HTML_ARROW_LEFT;
  arrowNavContainer.appendChild(arrowLeft);

  const arrowRight = document.createElement('a');
  arrowRight.setAttribute('id', 'slider-arrow-right');
  arrowRight.setAttribute('aria-label', 'Next Slide');
  arrowRight.setAttribute('role', 'button');
  arrowRight.innerHTML = HTML_ARROW_RIGHT;
  arrowNavContainer.appendChild(arrowRight);
  return arrowNavContainer;
};

// Create bottom bullet nav
const createBottomNav = (slides) => {
  const bottomNavContainer = document.createElement('div');
  bottomNavContainer.classList.add('bottom-nav');
  bottomNavContainer.setAttribute('role', 'group');
  bottomNavContainer.setAttribute('aria-label', 'Slide Controls');

  let j = 1;
  slides.forEach(() => {
    const nextSlide = slides.length === j ? 1 : j + 1;
    const bottomNavEl = document.createElement('a');
    bottomNavEl.setAttribute('id', `slider-dot-${j}`);
    bottomNavEl.setAttribute('aria-label', `Go to Slide ${nextSlide}`);
    bottomNavEl.setAttribute('role', 'button');
    bottomNavEl.classList.add('bullet');
    bottomNavEl.classList.add(j === 1 ? 'active' : 'inactive');
    bottomNavEl.setAttribute('aria-current', j === 1 ? 'true' : 'false');
    bottomNavEl.setAttribute('aria-controls', 'carousel');
    bottomNavContainer.appendChild(bottomNavEl);
    j += 1;
  });
  return bottomNavContainer;
};

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

// Add P around LI inner text
const addEnclosingDiv = (block) => {
  const listItems = block.querySelectorAll('.carousel > div > div > ul li');
  listItems.forEach((el) => {
    const li = el.innerHTML;
    el.innerHTML = '';
    el.innerHTML = `<div>${li}</div>`;
  });
};

export default function decorate(block) {
  optimizeThumbnails(block);
  addEnclosingDiv(block);

  const sliderWrapper = createSliderWrapper(block);
  const slider = createPictures(sliderWrapper);
  const slides = setPictureIds(slider);
  slideCount = slides.length;
  if (slideCount > 1) {
    const arrowNav = createArrowNav();
    slider.appendChild(arrowNav);

    const bottomNavContainer = createBottomNav(slides);
    sliderWrapper.appendChild(bottomNavContainer);

    initSlider();
  }
}
