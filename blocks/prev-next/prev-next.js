import { translate } from '../../scripts/lib-franklin.js';

const HTML_ARROW_PREV = '<svg fill="rgba(129,51,151,1)" xmlns="http://www.w3.org/2000/svg" width="30px" height="30px" viewBox="0 -120 600 600">\n'
  + '<path d="M97.141,225.92c0-8.095,3.091-16.192,9.259-22.366L300.689,9.27c12.359-12.359,32.397-12.359,44.751,0c12.354,12.354,12.354,32.388,0,44.748L173.525,225.92l171.903,171.909c12.354,12.354,12.354,32.391,0,44.744c-12.354,12.365-32.386,12.365-44.745,0l-194.29-194.281C100.226,242.115,97.141,234.018,97.141,225.92z"/>\n'
  + '</svg>';
const HTML_ARROW_NEXT = '<svg fill="rgba(129,51,151,1)" xmlns="http://www.w3.org/2000/svg" width="30px" height="30px" viewBox="0 -120 600 600">\n'
  + '<path d="M345.441,248.292L151.154,442.573c-12.359,12.365-32.397,12.365-44.75,0c-12.354-12.354-12.354-32.391,0-44.744L278.318,225.92L106.409,54.017c-12.354-12.359-12.354-32.394,0-44.748c12.354-12.359,32.391-12.359,44.75,0l194.287,194.284c6.177,6.18,9.262,14.271,9.262,22.366C354.708,234.018,351.617,242.115,345.441,248.292z"/>\n'
  + '</svg>\n';

export default async function decorate(block) {
  const moveHeaderLinkDiv = (el) => {
    const text = el.innerText;
    const newDiv = document.createElement('div');
    newDiv.classList.add('prev-next-header-link');
    newDiv.innerText = text;
    el.innerText = '';
    el.insertAdjacentElement('afterbegin', newDiv);
  };

  const buildNavButtons = async (key, defaultText) => {
    const newDiv = document.createElement('div');
    newDiv.classList.add('prev-next-button');
    newDiv.innerText = await translate(key, defaultText);
    return newDiv;
  };

  const createArrow = (direction) => {
    const arrow = document.createElement('div');
    arrow.classList.add(`${direction}-arrow`);
    arrow.innerHTML = direction === 'left' ? HTML_ARROW_PREV : HTML_ARROW_NEXT;
    return arrow;
  };

  if (!block) return;

  const prevNextContainer = block.firstElementChild;
  const verticalSeparator = document.createElement('div');
  verticalSeparator.classList.add('vertical-line');
  prevNextContainer.firstElementChild.insertAdjacentElement('afterend', verticalSeparator);

  const prevBox = prevNextContainer.firstElementChild.querySelector('a');
  const nextBox = prevNextContainer.lastElementChild.querySelector('a');

  if (prevBox) {
    moveHeaderLinkDiv(prevBox);
    prevBox.insertAdjacentElement('afterbegin', await buildNavButtons('navPreviousText', 'Previous'));
    prevBox.insertAdjacentElement('afterbegin', createArrow('left'));
  }

  if (nextBox) {
    moveHeaderLinkDiv(nextBox);
    nextBox.insertAdjacentElement('afterbegin', await buildNavButtons('navNextText', 'Next'));
    nextBox.insertAdjacentElement('afterbegin', createArrow('right'));
  }

  // Add Bottom Spacer
  const spacer = document.createElement('div');
  spacer.classList.add('bottom-spacer');
  block.appendChild(spacer);
}
