import {
  createDomStructure,
  decorateBlockImgs,
  decorateSupScript,
  getConfigValue,
  getInfo,
  getProducts,
  toCamelCase,
} from '../../scripts/lib-franklin.js';

function decorateProduct(base, product) {
  const children = [
    { type: 'h4', children: decorateSupScript(product.Name) },
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
    attributes: { href: `${base}/${product.Page}` },
    children,
  };
}

export default async function decorate(block) {
  const { country, language } = getInfo();
  const products = await getProducts(country, language);
  const base = `/${country}/${language}/${await getConfigValue(`${toCamelCase(`product Reference Support Url ${country}/${language}`)}`, 'product-support')}`;

  createDomStructure([
    {
      type: 'div',
      classes: ['product-list'],
      children: products.map((product) => decorateProduct(base, product)),
    }], block);

  decorateBlockImgs(block);
}
