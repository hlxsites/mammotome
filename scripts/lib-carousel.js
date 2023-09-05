/** @module lib-carousel2 */

/**
 * Slider duration in milliseconds for auto-advance.
 * @type {number}
 */
const SLIDER_INTERVAL = 3500;

// HTML code for arrow icons
const HTML_ARROW_LEFT = '<svg fill="rgb(217, 217, 217)" xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 600 600">\n'
  + '<path d="M97.141,225.92c0-8.095,3.091-16.192,9.259-22.366L300.689,9.27c12.359-12.359,32.397-12.359,44.751,0c12.354,12.354,12.354,32.388,0,44.748L173.525,225.92l171.903,171.909c12.354,12.354,12.354,32.391,0,44.744c-12.354,12.365-32.386,12.365-44.745,0l-194.29-194.281C100.226,242.115,97.141,234.018,97.141,225.92z"/>\n'
  + '</svg>';
const HTML_ARROW_RIGHT = '<svg fill="rgb(217, 217, 217)" xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 600 600">\n'
  + '<path d="M345.441,248.292L151.154,442.573c-12.359,12.365-32.397,12.365-44.75,0c-12.354-12.354-12.354-32.391,0-44.744L278.318,225.92L106.409,54.017c-12.354-12.359-12.354-32.394,0-44.748c12.354-12.359,32.391-12.359,44.75,0l194.287,194.284c6.177,6.18,9.262,14.271,9.262,22.366C354.708,234.018,351.617,242.115,345.441,248.292z"/>\n'
  + '</svg>\n';

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
 *
 * @param sliderContainer - DOM element where carousel will be inserted
 * @constructor
 */
export default function Carousel(sliderContainer) {
  const self = {
    carouselId: null,
    slideShow: false,
    slideCount: 0,
    activeSlide: 1,
    activeSlideElement: null,
    touchStartX: 0,
    touchEndX: 0,
    touchRelX: 0,
    touchStartY: 0,
    touchEndY: 0,
    touchRelY: 0,
    elementStartX: 0,
    sliderWrapper: null,
    slider: null,
    sliderChildren: null,
    sliderIds: [],
    dottedNavContainer: null,
    dottedNavChildren: null,
    arrowNavContainer: null,
    htmlArrowLeft: HTML_ARROW_LEFT,
    htmlArrowRight: HTML_ARROW_RIGHT,
    sliderInterval: SLIDER_INTERVAL,
    /**
     * Initialize the carousel
     */
    init() {
      self.carouselId = `carousel-${Math.floor(Math.random() * 1000000)}`;
      sliderContainer.setAttribute('id', self.carouselId);
      sliderContainer.classList.add('slider-wrapper');
      self.sliderWrapper = sliderContainer;
    },
    /**
     * Create a slider from a container element
     * @param container - default is self.sliderWrapper
     */
    createSlideSlider(container = self.sliderWrapper) {
      const existingDivs = container.children;
      const sliderDiv = document.createElement('div');
      if (existingDivs.length === 0) return;
      [...existingDivs].forEach((div) => {
        sliderDiv.appendChild(div);
      });
      sliderDiv.classList.add('slider');
      self.sliderWrapper.appendChild(sliderDiv);
      self.slider = sliderDiv;
      self.sliderChildren = Array.from(sliderDiv.children);
    },
    /**
     * Create a picture only slider from a container element
     * @param sliderWrapper - default is self.sliderWrapper
     */
    createPictureSlider(sliderWrapper = self.sliderWrapper) {
      const pictures = sliderWrapper.getElementsByTagName('picture');
      if (pictures.length === 0) return;
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
      self.sliderChildren = Array.from(slider.children);
    },
    /**
     * Change left and right arrow HTML if other than default arrows are required
     * @param leftHtml
     * @param rightHtml
     */
    setLeftAndRightArrowHtml(leftHtml, rightHtml) {
      self.htmlArrowLeft = leftHtml;
      self.htmlArrowRight = rightHtml;
    },
    /**
     * Create arrow navigation
     * @param container - default is self.sliderWrapper
     */
    createArrowNav(container = self.sliderWrapper) {
      const arrowNavContainer = document.createElement('div');
      arrowNavContainer.classList.add('arrow-nav');
      const arrowLeft = `
        <button id="slider-arrow-left"
                aria-label="Previous Slide">
          ${self.htmlArrowLeft}
        </button>
        `;
      const arrowRight = `
        <button id="slider-arrow-right"
                aria-label="Next Slide"
                role="button">
          ${self.htmlArrowRight}
        </button>
        `;
      arrowNavContainer.innerHTML = arrowLeft + arrowRight;
      container.appendChild(arrowNavContainer);
      self.arrowNavContainer = arrowNavContainer;
    },
    /**
     * Change Slider Interval if required
     * @param interval
     */
    setSliderInterval(interval) {
      self.sliderInterval = interval;
    },
    /**
     * Create dotted navigation
     * @returns {HTMLDivElement}
     */
    createDottedNav() {
      const dottedNavContainer = document.createElement('div');
      dottedNavContainer.classList.add('dotted-nav');
      const dottedNavAttributes = {
        'aria-label': 'Slide Controls',
        role: 'region',
      };
      addAttributes(dottedNavContainer, dottedNavAttributes);

      let j = 1;
      let navElements = '';

      self.sliderIds.forEach(() => {
        const dottedNavElAttribute = {
          id: `${self.carouselId}-dot-${j}`,
          'aria-label': `Select Slide ${j} of ${self.sliderIds.length}`,
          role: 'button',
          'aria-current': j === 1 ? 'true' : 'false',
          'aria-controls': `${self.carouselId}-slide-${j}`,
        };

        navElements += `
      <button id="${dottedNavElAttribute.id}" 
              aria-label="${dottedNavElAttribute['aria-label']}" 
              role="${dottedNavElAttribute.role}" 
              aria-current="${dottedNavElAttribute['aria-current']}" 
              aria-controls="${dottedNavElAttribute['aria-controls']}" 
              class="dot ${j === 1 ? 'active' : 'inactive'}">
      </button>
    `;
        j += 1;
      });

      dottedNavContainer.innerHTML = navElements;
      self.dottedNavChildren = Array.from(dottedNavContainer.children);
      self.dottedNavContainer = dottedNavContainer;
      self.sliderWrapper.appendChild(dottedNavContainer);
      return dottedNavContainer;
    },
    /**
     * Set slider ids if required for navigation purpose
     */
    setSliderIds() {
      let i = 1;
      self.sliderChildren.forEach((el) => {
        el.setAttribute('id', `${self.carouselId}-slide-${i}`);
        el.classList.add(i === 1 ? 'show' : 'hide');
        self.sliderIds.push(`${self.carouselId}-slide-${i}`);
        i += 1;
      });
    },
    /**
     * Increment the Slides based on direction
     * @param direction - +1 left or -1 right
     */
    incrementActiveSlide(direction) {
      if (direction > 0) {
        self.activeSlide = (self.activeSlide + 1) <= self.slideCount ? self.activeSlide + 1 : 1;
      } else {
        self.activeSlide = (self.activeSlide - 1) > 0 ? self.activeSlide - 1 : self.slideCount;
      }
      self.activeSlideElement = self.sliderChildren.find((el) => el.id === `${self.carouselId}-slide-${self.activeSlide}`);
    },
    /**
     * Activate a slide
     * @param slideId - sliderId, see SetSliderIds
     */
    activateSlide(slideId) {
      self.sliderChildren.forEach((el) => {
        if (el.id === slideId) {
          el.classList.replace('hide', 'show');
        } else {
          el.classList.replace('show', 'hide');
        }
      });
    },
    /**
     * Activate a dot
     * @param bulletId - bulletId
     */
    activateDot(bulletId) {
      if (self.dottedNavContainer) {
        self.dottedNavChildren.forEach((el) => {
          const isActive = el.id === bulletId;
          el.classList.toggle('active', isActive);
          el.classList.toggle('inactive', !isActive);
          el.setAttribute('aria-current', isActive ? 'true' : 'false');
        });
      }
    },
    /**
     * Move the slide based on direction
     * @param direction - +1 left or -1 right
     */
    moveSlide(direction) {
      self.incrementActiveSlide(direction);
      self.activateSlide(`${self.carouselId}-slide-${self.activeSlide}`);
      self.activateDot(`${self.carouselId}-dot-${self.activeSlide}`);
    },
    /**
     * Start the slide show
     */
    startSlideShow() {
      if (!self.slideShow) {
        self.slideShow = window.setInterval(() => self.moveSlide(1), self.sliderInterval);
      }
    },
    /**
     *
     */
    stopSlideShow() {
      window.clearInterval(self.slideShow);
      self.slideShow = false;
    },
    /**
     * Navigate to a slide when clicked on a dot
     * @param event
     */
    dottedNavigation(event) {
      const matches = event.target.id.match(/\d+$/);
      const targetId = matches ? parseInt(matches[0], 10) : 1;
      const sliderTarget = `${self.carouselId}-slide-${targetId}`;
      self.activateSlide(sliderTarget);
      self.activateDot(event.target.id);
      self.activeSlideElement = self.sliderChildren.find((el) => el.id === sliderTarget);
      self.activeSlide = parseInt(targetId, 10);
    },
    /**
     *
     * @param event
     */
    arrowNavigation(event) {
      const navButton = event.currentTarget.id;
      const increment = navButton === 'slider-arrow-left' ? -1 : 1;
      self.incrementActiveSlide(increment);
      self.activateSlide(`${self.carouselId}-slide-${self.activeSlide}`);
      self.activateDot(`${self.carouselId}-dot-${self.activeSlide}`);
    },
    /**
     * Register click events for dots
     */
    dottedNavClickEvents() {
      if (!self.dottedNavContainer) return;
      self.dottedNavContainer.addEventListener('click', (event) => {
        if (event.target && event.target.nodeName === 'BUTTON') self.dottedNavigation(event);
      });
    },
    /**
     * register click events for arrows
     */
    arrowNavOnClickEvents() {
      if (!self.arrowNavContainer) return;
      Array.from(self.arrowNavContainer.children).forEach((el) => {
        el.addEventListener('click', (event) => {
          self.arrowNavigation(event);
        });
      });
    },
    /**
     *
     */
    touchStartEl() {
      self.sliderWrapper.addEventListener(
        'touchstart',
        (e) => {
          self.touchStartX = Math.floor(e.touches[0].clientX);
          self.touchStartY = Math.floor(e.touches[0].clientY);
          self.elementStartPosX = self.activeSlideElement.offsetLeft;
          self.stopSlideShow();
        },
        { passive: false },
      );
    },
    /**
     * Register touch move events
     */
    touchMoveEl() {
      self.sliderWrapper.addEventListener(
        'touchmove',
        (e) => {
          self.touchRelX = Math.floor(e.touches[0].clientX) - self.touchStartX;
          self.touchRelY = Math.floor(e.touches[0].clientY) - self.touchStartY;
          if (self.shouldPreventDefaultScrolling(e)) self.activeSlideElement.style.transform = `translateX(${self.elementStartPosX + self.touchRelX}px)`;
        },
        { passive: false },
      );
    },
    /**
     * Handle scrolling if user swipes left or right
     * @param e
     * @returns {boolean}
     */
    shouldPreventDefaultScrolling(e) {
    // if target is a link or button, allow scrolling and don't prevent default
      if (['a', 'button', 'svg'].includes(e.target.tagName.toLowerCase())) {
        return false;
      }

      const isMovingVertically = Math.abs(self.touchRelY) > Math.abs(self.touchRelX);
      // if touch move is not vertical (=horizontal) prevent scrolling
      if (!isMovingVertically) {
        e.preventDefault();
        return true;
      }

      return false;
    },
    /**
     * Register touch end events
     */
    touchEndEl() {
      self.sliderWrapper.addEventListener(
        'touchend',
        (e) => {
          self.touchEndX = Math.floor(e.changedTouches[0].clientX);
          const previousSlide = self.activeSlideElement;
          if (self.shouldPreventDefaultScrolling(e)) self.handleGesture();
          previousSlide.style.removeProperty('transform');
        },
        { passive: false },
      );
    },
    /**
     * Handle the gesture
     */
    handleGesture() {
      if (self.touchEndX < self.touchStartX) {
        self.moveSlide(1);
      }
      if (self.touchEndX > self.touchStartX) {
        self.moveSlide(-1);
      }
    },
    /**
     * Register click events for dots
     */
    dottedNavOnClickEvents() {
      if (!self.dottedNavContainer) return;
      self.dottedNavContainer.addEventListener('click', (event) => {
        if (event.target && event.target.nodeName === 'BUTTON') self.dottedNavigation(event);
      });
    },
    /**
     * Initialize Slider once setup is done
     * @param dottedNav - if true, register click events for dots
     * @param arrowNav - if true, register click events for arrows
     * @param touchNav - if true, register touch events
     */
    initSlider(dottedNav = true, arrowNav = true, touchNav = true) {
      self.slideCount = self.sliderIds.length;
      self.activeSlideElement = document.getElementById(`${self.carouselId}-slide-${self.activeSlide}`);
      if (touchNav) {
        self.touchStartEl();
        self.touchMoveEl();
        self.touchEndEl();
      }
      // if there is more than one slide and sliderDurationMs is set, start slide show
      if (self.slideCount > 1 && self.sliderInterval > 0) {
        self.sliderWrapper.addEventListener('mouseover', self.stopSlideShow);
        self.sliderWrapper.addEventListener('mouseleave', self.startSlideShow);
        self.startSlideShow();
      }
      if (dottedNav) self.dottedNavOnClickEvents();
      if (arrowNav) self.arrowNavOnClickEvents();
    },
    /**
     * Check if Slider has slides attached
     * @return {boolean}
     */
    hasSlides() {
      return (self.sliderChildren.length > 0) || false;
    },
    /**
     * Get all slides
     * @return {null}
     */
    getSlides() {
      return self.sliderChildren;
    },
    getArrowNavContainer() {
      return self.arrowNavContainer;
    },
  };
  self.init();
  return self;
}
