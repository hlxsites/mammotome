/**
 * Slider duration in milliseconds for auto-advance.
 * @type {number}
 */
const sliderDurationMs = 3500;

// HTML code for arrow icons
const HTML_ARROW_LEFT = '<svg fill="rgb(217, 217, 217)" xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 600 600">\n'
  + '<path d="M97.141,225.92c0-8.095,3.091-16.192,9.259-22.366L300.689,9.27c12.359-12.359,32.397-12.359,44.751,0c12.354,12.354,12.354,32.388,0,44.748L173.525,225.92l171.903,171.909c12.354,12.354,12.354,32.391,0,44.744c-12.354,12.365-32.386,12.365-44.745,0l-194.29-194.281C100.226,242.115,97.141,234.018,97.141,225.92z"/>\n'
  + '</svg>';
const HTML_ARROW_RIGHT = '<svg fill="rgb(217, 217, 217)" xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 600 600">\n'
  + '<path d="M345.441,248.292L151.154,442.573c-12.359,12.365-32.397,12.365-44.75,0c-12.354-12.354-12.354-32.391,0-44.744L278.318,225.92L106.409,54.017c-12.354-12.359-12.354-32.394,0-44.748c12.354-12.359,32.391-12.359,44.75,0l194.287,194.284c6.177,6.18,9.262,14.271,9.262,22.366C354.708,234.018,351.617,242.115,345.441,248.292z"/>\n'
  + '</svg>\n';

let activeSlide = 1;
let slideShow = false;
let slideCount = 0;
let touchStartX = 0;
let touchEndX = 0;
let touchRelX = 0;

/**
 * Increment active slide value
 * @param direction
 */
const incrementActiveSlide = (direction = 1) => {
  if (direction > 0) {
    activeSlide = (activeSlide + 1) <= slideCount ? activeSlide + 1 : 1;
  } else {
    activeSlide = (activeSlide - 1) > 0 ? activeSlide - 1 : slideCount;
  }
  return activeSlide;
};

/**
 * add attributes stored in key-value object to an element
 * @param el
 * @param attributes
 */
const addAttributes = (el, attributes) => {
  Object.keys(attributes).forEach((key) => {
    el.setAttribute(key, attributes[key]);
  });
};

/**
 * Activate/deactivate bottom bullets based on active slide
 * @param bulletId
 */
const activateBullet = (bulletId) => {
  const btnNav = document.querySelector('.dotted-nav');
  [...btnNav.children].forEach((el) => {
    const isActive = el.id === bulletId;
    el.classList.toggle('active', isActive);
    el.classList.toggle('inactive', !isActive);
    el.setAttribute('aria-current', isActive ? 'true' : 'false');
  });
};

/**
 * Slides picture switcher
 * @param slideId: format: slider-slide-${activeSlide}
 */
const activateSlide = (slideId) => {
  const slider = document.querySelector('.slider');
  Array.from(slider.children).forEach((el) => {
    if (el.id === slideId) {
      el.classList.replace('hide', 'show');
      el.style.removeProperty('left');
    } else {
      el.classList.replace('show', 'hide');
    }
  });
};

/**
 * Navigate with Bottom Bullet navigation
 * @param event
 */
const dottedNavigation = (event) => {
  const targetId = event.target.id.match(/\d+/)?.[0] || 1;
  const sliderTarget = `slider-slide-${targetId}`;
  activateSlide(sliderTarget);
  activateBullet(event.target.id);
  activeSlide = incrementActiveSlide();
};

/**
 * Navigate with left and right for arrow navigation
 * @param event
 */
const arrowNavigation = (event) => {
  const navButton = event.currentTarget.id;
  const increment = navButton === 'slider-arrow-left' ? -1 : 1;

  activeSlide = incrementActiveSlide(increment);
  activateSlide(`slider-slide-${activeSlide}`);
  activateBullet(`slider-dot-${activeSlide}`);
};

/**
 * Add event listeners for bottom bullet navigation
 */
const dottedNavOnClickEvents = () => {
  const btnNav = document.querySelector('.dotted-nav');
  btnNav.addEventListener('click', (event) => {
    dottedNavigation(event);
  });
};

/**
 * Event Listeners for arrow navigation
 */
const arrowNavOnClickEvents = () => {
  const arrowNav = document.querySelector('.arrow-nav');
  if (arrowNav) {
    arrowNav.addEventListener('click', (event) => {
      arrowNavigation(event);
    });
  }
};

/**
 * Navigate to next slide
 */
const toNextSlide = () => {
  activeSlide = incrementActiveSlide(1);
  activateSlide(`slider-slide-${activeSlide}`);
  activateBullet(`slider-dot-${activeSlide}`);
};

/**
 * Navigate to previous slide
 */
const toPrevSlide = () => {
  activeSlide = incrementActiveSlide(-1);
  activateSlide(`slider-slide-${activeSlide}`);
  activateBullet(`slider-dot-${activeSlide}`);
};

/**
 * Start slide show
 */
const startSlideShow = () => {
  if (!slideShow) {
    slideShow = window.setInterval(() => toNextSlide(slideCount), sliderDurationMs);
  }
};

/**
 * Stop automatic Slideshow
 */
const stopSlideShow = () => {
  window.clearInterval(slideShow);
  slideShow = false;
};

/**
 * Handle touch gestures (back and forward swipe) for touch devices
 */
function handleGesture() {
  if (touchEndX < touchStartX) {
    toNextSlide();
  }
  if (touchEndX > touchStartX) {
    toPrevSlide();
  }
}

/**
 * Prevent scrolling when swiping for touch devices
 * @param e event
 */
function disableScrolling(e) {
  const isLink = e.target.tagName.toLowerCase() === 'a';
  const isButton = e.target.tagName.toLowerCase() === 'button';
  if (!isLink && !isButton) {
    e.preventDefault();
  }
}

/**
 * Touch Move Event Listener
 * @param slideContainer: slider wrapper or block containing the slides
 */
function touchMoveEl(slideContainer) {
  slideContainer.addEventListener(
    'touchmove',
    (e) => {
      disableScrolling(e);
      touchRelX = Math.floor(e.touches[0].clientX) - touchStartX;
      const slide = document.getElementById(`slider-slide-${activeSlide}`);
      slide.style.left = `${touchRelX}px`;
    },
    { passive: false },
  );
}

/**
 * Touch Start Event Listener
 * @param slideContainer: slider wrapper or block containing the slides
 */
function touchStartEl(slideContainer) {
  slideContainer.addEventListener(
    'touchstart',
    (e) => {
      disableScrolling(e);
      touchStartX = Math.floor(e.touches[0].clientX);
      stopSlideShow();
    },
    { passive: false },
  );
}

/**
 * Touch End Event Listener
 * @param slideContainer: slider wrapper or block containing the slides
 */
function touchEndEl(slideContainer) {
  slideContainer.addEventListener(
    'touchend',
    (e) => {
      disableScrolling(e);
      touchEndX = Math.floor(e.changedTouches[0].clientX);
      handleGesture();
    },
    { passive: false },
  );
}

/**
 * Initialize Slider
 * @param slidesLength: number of slides
 */
export function initSlider(slidesLength) {
  slideCount = slidesLength;
  const sliderWrapper = document.querySelector('.slider-wrapper');
  sliderWrapper.addEventListener('mouseover', stopSlideShow);
  sliderWrapper.addEventListener('mouseleave', startSlideShow);
  touchStartEl(sliderWrapper);
  touchMoveEl(sliderWrapper);
  touchEndEl(sliderWrapper);
  startSlideShow();
  dottedNavOnClickEvents();
  arrowNavOnClickEvents();
}

/**
 * Create Arrow navigation
 * @returns {HTMLDivElement}
 */
export function createArrowNav() {
  const arrowNavContainer = document.createElement('div');
  arrowNavContainer.classList.add('arrow-nav');

  const arrowLeft = document.createElement('button');
  const leftSliderAttributes = {
    id: 'slider-arrow-left',
    'aria-label': 'Previous Slide',
  };
  addAttributes(arrowLeft, leftSliderAttributes);
  arrowLeft.innerHTML = HTML_ARROW_LEFT;
  arrowNavContainer.appendChild(arrowLeft);

  const arrowRight = document.createElement('button');
  const rightSliderAttributes = {
    id: 'slider-arrow-right',
    'aria-label': 'Next Slide',
    role: 'button',
  };
  addAttributes(arrowRight, rightSliderAttributes);
  arrowRight.innerHTML = HTML_ARROW_RIGHT;
  arrowNavContainer.appendChild(arrowRight);
  return arrowNavContainer;
}

/**
 * Create bottom bullet navigation
 * @param slides: create a dotted navigation for each slide and return the container
 * @returns {HTMLDivElement}
 */
export function createDottedNav(slides) {
  const dottedNavContainer = document.createElement('div');
  dottedNavContainer.classList.add('dotted-nav');
  const bottomNavAttributes = {
    'aria-label': 'Slide Controls',
    role: 'region',
  };
  addAttributes(dottedNavContainer, bottomNavAttributes);

  let j = 1;
  slides.forEach(() => {
    // const nextSlide = slides.length === j ? 1 : j + 1;
    const bottomNavEl = document.createElement('button');
    const bottomNavElAttribute = {
      id: `slider-dot-${j}`,
      'aria-label': `Select Slide ${j} of ${slides.length}`,
      role: 'button',
      'aria-current': j === 1 ? 'true' : 'false',
      'aria-controls': `slider-slide-${j}`,
    };
    addAttributes(bottomNavEl, bottomNavElAttribute);
    bottomNavEl.classList.add('dot');
    bottomNavEl.classList.add(j === 1 ? 'active' : 'inactive');
    dottedNavContainer.appendChild(bottomNavEl);
    j += 1;
  });
  return dottedNavContainer;
}

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
 * Set slide-wrapper class
 * @param sliderWrapper
 * @returns {*}
 */
export function createSliderWrapper(sliderWrapper) {
  sliderWrapper.classList.add('slider-wrapper');
  return sliderWrapper;
}

/**
 * Create non Picture Slider from existing sliderWrapper
 * @param sliderWrapper
 */
export function createSlider(sliderWrapper) {
  const existingDivs = sliderWrapper.children;
  const slider = document.createElement('div');
  if (existingDivs.length > 0) {
    [...existingDivs].forEach((el) => {
      slider.appendChild(el);
    });
  }
  slider.classList.add('slider');
  sliderWrapper.appendChild(slider);
  return slider;
}

/**
 * // set picture id (slide 1 - n)
 * @param slider
 * @returns {*[]}
 */
export function setSliderIds(slider) {
  let i = 1;
  const slides = [];
  [...slider.children].forEach((el) => {
    el.setAttribute('id', `slider-slide-${i}`);
    el.classList.add(i === 1 ? 'show' : 'hide');
    slides.push(`slider-slide-${i}`);
    i += 1;
  });
  return slides;
}

/**
 * put pictures under slider flex container
 * @param sliderWrapper
 * @returns {HTMLDivElement}
 */
export function createPictures(sliderWrapper) {
  const pictures = sliderWrapper.getElementsByTagName('picture');
  const slider = document.createElement('div');
  slider.classList.add('slider');
  [...pictures].forEach((el) => {
    slider.appendChild(el);
  });
  sliderWrapper.innerHTML = '';
  sliderWrapper.appendChild(slider);
  const sliderAttributes = {
    id: 'carousel',
    role: 'group',
    'aria-label': 'Slider Carousel',
  };
  addAttributes(slider, sliderAttributes);
  return slider;
}
