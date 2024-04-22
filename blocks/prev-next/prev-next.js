import { decorateSupScriptInTextBelow, translate } from '../../scripts/lib-franklin.js';

const HTML_ARROW_PREV = '<svg fill="rgba(129,51,151,1)" width="30px" height="30px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512">'
  + '<path d="M31.7 239l136-136c9.4-9.4 24.6-9.4 33.9 0l22.6 22.6c9.4 9.4 9.4 24.6 0 33.9L127.9 256l96.4 96.4c9.4 9.4 9.4 24.6 0 33.9L201.7 409c-9.4 9.4-24.6 9.4-33.9 0l-136-136c-9.5-9.4-9.5-24.6-.1-34z"/>'
  + '</svg>';

const HTML_ARROW_NEXT = '<svg fill="rgba(129,51,151,1)" width="30px" height="30px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512">'
  + '<path d="M224.3 273l-136 136c-9.4 9.4-24.6 9.4-33.9 0l-22.6-22.6c-9.4-9.4-9.4-24.6 0-33.9l96.4-96.4-96.4-96.4c-9.4-9.4-9.4-24.6 0-33.9L54.3 103c9.4-9.4 24.6-9.4 33.9 0l136 136c9.5 9.4 9.5 24.6.1 34z"/>'
  + '</svg>';

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

  decorateSupScriptInTextBelow(prevBox);
  decorateSupScriptInTextBelow(nextBox);
}
