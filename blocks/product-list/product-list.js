import {
  createDomStructure, decorateBlockImgs, decorateSupScript, getProducts,
} from '../../scripts/lib-franklin.js';

function getInfo() {
  const url = new URL(window.location);
  return { country: 'US', language: url.pathname.substring(1, url.pathname.indexOf('/', 1)) };
}

function decorateProduct(product) {
  const children = [
    { type: 'h3', children: decorateSupScript(product.Name) },
  ];

  if (product.Image) {
    children.unshift({
      type: 'div',
      classes: ['container'],
      children: [{ type: 'img', attributes: { src: product.Image } }],
    });
  }

  return {
    type: 'a',
    classes: ['product'],
    attributes: { href: `product-support/${product.Page}` },
    children,
  };
}

export default async function decorate(block) {
  const { country, language } = getInfo();
  const products = await getProducts(country, language);

  createDomStructure([
    {
      type: 'div',
      classes: ['product-list'],
      children: products.map(decorateProduct),
    }], block);

  decorateBlockImgs(block);
}
