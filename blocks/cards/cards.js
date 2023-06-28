import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

const isValidUrl = (urlString) => {
  try {
    return new URL(urlString);
  } catch (e) {
    return false;
  }
};

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');

  const processRow = (row) => {
    const li = document.createElement('li');
    let cardLink;

    const processDiv = (div) => {
      const { children } = div;
      const picture = div.querySelector('picture');

      if (children.length === 1 && picture) {
        div.className = 'cards-card-image';
      } else {
        div.className = children.length ? 'cards-card-body' : 'cards-card-body empty';
        const action = div.querySelector('p a');

        const containsHeading = Array.from(div.querySelectorAll('h1, h2, h3')).length > 0;

        if (!containsHeading) {
          div.classList.add('no-heading');
        } else {
          // remove download icons for headings
          div.querySelectorAll('h1, h2, h3 i.link-icon')
            .forEach((heading) => heading.querySelectorAll('i.link-icon')
              .forEach((icon) => icon.remove()));
        }

        if (action) {
          const actionBlock = div.querySelector('.button-container') || action.parentElement;
          actionBlock.className = isValidUrl(action.text) ? 'callout hidden' : 'callout';
          div.classList.toggle('callout-hidden', actionBlock.classList.contains('hidden'));

          actionBlock.innerHTML = action.innerHTML;

          cardLink = document.createElement('a');
          cardLink.href = action.href;
          cardLink.innerHTML = row.innerHTML;
        }
      }
    };

    [...row.children].forEach(processDiv);

    if (cardLink) {
      li.appendChild(cardLink);
    } else {
      li.innerHTML = row.innerHTML;
    }
    return li;
  };

  [...block.children].forEach((row) => {
    ul.append(processRow(row));
  });

  const processImg = (img) => {
    const picture = img.closest('picture');
    picture.replaceWith(createOptimizedPicture(img.src, img.alt, false, null, null, [{ width: '600' }]));
  };

  ul.querySelectorAll('img').forEach(processImg);

  block.textContent = '';
  block.append(ul);
}
