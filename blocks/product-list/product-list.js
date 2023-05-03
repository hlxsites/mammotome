import { createDomStructure, getProductDB } from '../../scripts/lib-franklin.js';

function getInfo() {
  const url = new URL(window.location);
  return { language: url.pathname.substring(1, url.pathname.indexOf('/', 1)) };
}

function getProducts(json, language) {
  const languageUpper = language.toUpperCase();
  return json.Product.data
    .filter((entry) => entry.Languages.split('|')
      .map((lang) => lang.toUpperCase())
      .includes(languageUpper))
    .map((product) => {
      const translation = json.ProductTranslation.data
        .find((entry) => entry.ProductRef === product.ProductCodes
          && entry.Language === language);
      product.Name = translation?.Name || product.Name;
      product.Image = translation?.Image || product.Image;
      return product;
    });
}

function decorateProduct(product) {
  const children = [
    { type: 'h3', textContent: product.Name },
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
    attributes: { href: `product-support/${product.ProductCodes.split('|')[0]}` },
    children,
  };
}

export default async function decorate(block) {
  const json = await getProductDB();
  const { language } = getInfo();
  const products = getProducts(json, language);

  createDomStructure([
    {
      type: 'div',
      classes: ['product-list'],
      children: products.map(decorateProduct),
    }], block);
}
