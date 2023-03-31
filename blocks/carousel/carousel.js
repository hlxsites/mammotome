let activeSlide = 1;
let slideCount = 0;
let slideShow = false;

const HTML_ARROW_LEFT = '<svg fill="rgba(238, 238, 238, 0.9)" xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 600 600">\n'
  + '<path d="M97.141,225.92c0-8.095,3.091-16.192,9.259-22.366L300.689,9.27c12.359-12.359,32.397-12.359,44.751,0c12.354,12.354,12.354,32.388,0,44.748L173.525,225.92l171.903,171.909c12.354,12.354,12.354,32.391,0,44.744c-12.354,12.365-32.386,12.365-44.745,0l-194.29-194.281C100.226,242.115,97.141,234.018,97.141,225.92z"/>\n'
  + '</svg>';
const HTML_ARROW_RIGHT = '<svg fill="rgba(238, 238, 238, 0.9)" xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 600 600">\n'
  + '<path d="M345.441,248.292L151.154,442.573c-12.359,12.365-32.397,12.365-44.75,0c-12.354-12.354-12.354-32.391,0-44.744L278.318,225.92L106.409,54.017c-12.354-12.359-12.354-32.394,0-44.748c12.354-12.359,32.391-12.359,44.75,0l194.287,194.284c6.177,6.18,9.262,14.271,9.262,22.366C354.708,234.018,351.617,242.115,345.441,248.292z"/>\n'
  + '</svg>\n';

const activateBullet = (bulletId) => {
  const btnNav = document.querySelector('.bottom-nav');
  [...btnNav.children].forEach((el) => {
    if (el.id === bulletId) {
      el.classList.replace('inactive', 'active');
    } else {
      el.classList.replace('active', 'inactive');
    }
  });
};

const activateSlide = (targetPicture) => {
  // Switch slide pictures
  const slider = document.querySelector('.slider');
  [...slider.children].forEach((el) => {
    if (el.id === targetPicture) {
      el.classList.replace('hide', 'show');
    } else {
      el.classList.replace('show', 'hide');
    }
  });
};

const bottomNavigation = (event) => {
  const target = event.target.id;
  activateSlide(target);
  activateBullet(target);
};

const arrowNavigation = (event) => {
  const navButton = event.currentTarget.id;
  let nextSlide = 0;
  if (navButton === 'arrow-left') {
    nextSlide = (activeSlide - 1) > 0 ? activeSlide - 1 : slideCount;
  } else if (navButton === 'arrow-right') {
    nextSlide = (activeSlide + 1) <= slideCount ? activeSlide + 1 : 1;
  }
  activateSlide(`slide-${nextSlide}`);
  activateBullet(`slide-${nextSlide}`);
  activeSlide = nextSlide;
};

const bottomNavOnClickEvents = () => {
  const btnNav = document.querySelector('.bottom-nav');
  [...btnNav.children].forEach((el) => {
    el.addEventListener('click', bottomNavigation);
  });
};

const arrowNavOnClickEvents = () => {
  const arrowNav = document.querySelector('.arrow-nav');
  [...arrowNav.children].forEach((el) => {
    el.addEventListener('click', arrowNavigation);
  });
};

// Control Slide show
const toNextSlide = () => {
  const nextSlide = (activeSlide + 1) <= slideCount ? activeSlide + 1 : 1;

  activateSlide(`slide-${nextSlide}`);
  activateBullet(`slide-${nextSlide}`);
  activeSlide = nextSlide;
};

// Start slide show
const startSlideShow = () => {
  if (!slideShow) {
    slideShow = window.setInterval(toNextSlide, 5000);
  }
};

const stopSlideShow = () => {
  slideShow = window.clearInterval(slideShow);
};

const initSlider = () => {
  const sliderWrapper = document.querySelector('.slider-wrapper');
  sliderWrapper.addEventListener('mouseover', stopSlideShow);
  sliderWrapper.addEventListener('mouseleave', startSlideShow);
  window.addEventListener('load', startSlideShow);
};

export default function decorate(block) {
  // Set slide-wrapper class
  const sliderWrapper = block.firstElementChild.lastElementChild;
  sliderWrapper.classList.add('slider-wrapper');

  // put pictures under slider flex container
  const pictures = sliderWrapper.getElementsByTagName('picture');
  const slider = document.createElement('div');
  slider.classList.add('slider');
  [...pictures].forEach((el) => {
    slider.appendChild(el);
  });
  sliderWrapper.innerHTML = '';
  sliderWrapper.appendChild(slider);

  // set picture id slide 1 - n
  let i = 1;
  const slides = [];
  [...slider.children].forEach((el) => {
    el.setAttribute('id', `slide-${i}`);
    el.classList.add(i === 1 ? 'show' : 'hide');
    slides.push(`slide-${i}`);
    i += 1;
  });
  slideCount = slides.length;

  // Create Arrow nav
  const arrowNavContainer = document.createElement('div');
  arrowNavContainer.classList.add('arrow-nav');

  const arrowLeft = document.createElement('a');
  arrowLeft.setAttribute('id', 'arrow-left');
  arrowLeft.setAttribute('href', '#');
  arrowLeft.innerHTML = HTML_ARROW_LEFT;
  arrowNavContainer.appendChild(arrowLeft);

  const arrowRight = document.createElement('a');
  arrowRight.setAttribute('id', 'arrow-right');
  arrowRight.setAttribute('href', '#');
  arrowRight.innerHTML = HTML_ARROW_RIGHT;
  arrowNavContainer.appendChild(arrowRight);

  // sliderWrapper.appendChild(arrowNavContainer);
  slider.appendChild(arrowNavContainer);

  // Create bottom nav
  const bottomNavContainer = document.createElement('div');
  bottomNavContainer.classList.add('bottom-nav');

  let j = 1;
  slides.forEach((el) => {
    const bottomNavEl = document.createElement('a');
    bottomNavEl.setAttribute('id', el);
    bottomNavEl.setAttribute('href', '#');
    bottomNavEl.classList.add('bullet');
    bottomNavEl.classList.add(j === 1 ? 'active' : 'inactive');
    bottomNavContainer.appendChild(bottomNavEl);
    j += 1;
  });
  sliderWrapper.appendChild(bottomNavContainer);

  bottomNavOnClickEvents();
  arrowNavOnClickEvents();
  initSlider();
}
