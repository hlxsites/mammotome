import {
  addEnclosingDiv,
  createSliderWrapper,
  setSliderIds,
  createDottedNav,
  initSlider,
  createPictures,
  createArrowNav,
  optimizeThumbnails,
} from '../../scripts/lib-carousel.js';

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
