import { getMetadata } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  const links = block.querySelectorAll('a');
  if (!links.length) return;
  const actualPage = getMetadata('og:url').split('/').slice(-1)[0].toLowerCase();
  links.forEach((a) => {
    const href = a.getAttribute('href').toLowerCase();
    if (href.includes(actualPage)) {
      a.classList.add('active');
    }
  });
}
