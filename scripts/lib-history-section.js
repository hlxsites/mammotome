/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {
  buildBlock,
  decorateIcons,
} from './lib-franklin.js';

export function* getNextSiblings(element, selector) {
  let nextElement = element.nextElementSibling;
  while (nextElement) {
    if (selector && nextElement.matches(selector)) {
      return;
    }
    yield nextElement;
    nextElement = nextElement.nextElementSibling;
  }
}

/**
 * Decorates the history page.
 * @param {Element} section The section
 */
// eslint-disable-next-line import/prefer-default-export
export async function decorateHistorySection(section) {
  try {
    const parent = section.querySelector('.default-content-wrapper');
    const firstH3 = parent.querySelector('h3');

    // wrap all H3 and p in a timeline element
    const timelineBlock = buildBlock('timeline', null);
    parent.insertBefore(timelineBlock, firstH3);
    timelineBlock.append(firstH3, ...getNextSiblings(firstH3));

    // create small "year blocks" for every year
    const yearBlocks = [];
    [...timelineBlock.children].forEach((el) => {
      if (el.tagName === 'H3') {
        const yearBlock = buildBlock('year', null);
        yearBlocks.push([yearBlock, [el, ...getNextSiblings(el, 'H3')]]);
      }
    });

    yearBlocks.forEach((block) => {
      const [yearBlock, descriptionBlockChildren] = block;
      timelineBlock.append(yearBlock);

      // create small "description block" for every year
      const descriptionBlock = buildBlock('description', null);
      yearBlock.append(descriptionBlock);
      descriptionBlock.append(...descriptionBlockChildren);

      // append calendar icon (as sprite)
      const icon = document.createElement('span');
      icon.classList.add('icon', 'icon-calendar');
      yearBlock.append(icon);
    });

    await decorateIcons(section);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Decorating History page failed', error);
  }
}
/**
 * Observe the history page for changes.
 * @param {Element} section The section
*/
// eslint-disable-next-line import/prefer-default-export
export async function observeHistorySection(section) {
  try {
    const highlightWhenInViewport = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        // leave this here for debugging: console.log(entry.target.querySelector('h3').innerText);
        const { isIntersecting } = entry;
        if (isIntersecting) {
          entry.target.classList.add('highlight');
        } else if (entry.boundingClientRect.top > 0) {
          entry.target.classList.remove('highlight');
        }
      });
    }, {
      rootMargin: '50px',
      threshold: 1,
    });

    const yearBlocks = section.querySelectorAll('.timeline .year');
    yearBlocks.forEach((el) => highlightWhenInViewport.observe(el));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Observer of History page failed', error);
  }
}
