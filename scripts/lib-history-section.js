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

function getNextSiblings(child, parent, until) {
  let isNextSiblings = false;
  const nextSiblings = [];
  parent.childNodes.forEach((node) => {
    if (until === 'UNTIL_NEXT_H3' && node.tagName.toLowerCase() === 'h3') {
      isNextSiblings = false;
    }
    if (isNextSiblings) {
      nextSiblings.push(node);
    }
    if (node === child) {
      nextSiblings.push(node);
      isNextSiblings = true;
    }
  });
  return nextSiblings;
}

/**
 * Decorates the history page.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export async function decorateHistorySection(main) {
  try {
    const section = main.querySelector('.section.our-history');
    const parent = section.querySelector('.default-content-wrapper');
    const firstH3 = parent.querySelector('h3');

    // wrap all h3 and p in a timeline element
    const timelineBlock = buildBlock('timeline', null);
    parent.insertBefore(timelineBlock, firstH3);
    timelineBlock.append(...getNextSiblings(firstH3, parent));

    // create small blocks for every year
    const yearBlocks = [];
    timelineBlock.childNodes.forEach((el) => {
      if (el.tagName.toLowerCase() === 'h3') {
        const yearBlock = buildBlock('year', null);
        yearBlocks.push([yearBlock, getNextSiblings(el, timelineBlock, 'UNTIL_NEXT_H3')]);
      }
    });
    yearBlocks.forEach((block) => {
      timelineBlock.append(block[0]);
      block[0].append(...block[1]);

      // append calendar icon (as sprite)
      const icon = document.createElement('span');
      icon.classList.add('icon', 'icon-calendar');
      block[0].append(icon);
    });

    // change order and move picture element before h3 element. needed for mobile.
    yearBlocks.forEach((block) => {
      block[0].childNodes.forEach((el) => {
        if (el.tagName.toLowerCase() === 'h3' && el.nextSibling?.firstElementChild?.tagName?.toLowerCase() === 'picture') {
          block[0].insertBefore(el.nextSibling, el);
        }
      });
    });

    await decorateIcons(section);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Decorating History page failed', error);
  }
}
/**
 * Observe the history page for changes.
 * @param {Element} main The main element
*/
// eslint-disable-next-line import/prefer-default-export
export async function observeHistorySection(main) {
  try {
    const section = main.querySelector('.section.our-history');
    const highlightWhenInViewport = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const { isIntersecting } = entry;
        if (isIntersecting) {
          entry.target.classList.add('highlight');
        } else {
          entry.target.classList.remove('highlight');
        }
      });
    }, {
      rootMargin: '0px',
      threshold: 1,
    });

    const yearBlocks = section.querySelectorAll('.timeline .year');
    yearBlocks.forEach((el) => highlightWhenInViewport.observe(el));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Observer of History page failed', error);
  }
}
