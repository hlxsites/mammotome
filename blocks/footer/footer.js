import { decorateIcons, decorateSupScriptInTextBelow, getMetadata } from '../../scripts/lib-franklin.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerPath = getMetadata('footer') || '/footer';

  const resp = await fetch(`${footerPath}.plain.html`, window.location.pathname.endsWith('/footer') ? { cache: 'reload' } : {});

  if (resp.ok) {
    const html = await resp.text();

    // decorate footer DOM
    const footer = document.createElement('div');
    footer.innerHTML = html;

    await decorateIcons(footer);
    decorateSupScriptInTextBelow(footer);
    block.append(footer);
  }
}
