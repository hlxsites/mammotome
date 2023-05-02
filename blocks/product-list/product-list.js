import { createDomStructure } from '../../scripts/lib-franklin.js';

function getInfo() {
  const url = new URL(window.location);
  return { language: url.pathname.substring(1, url.pathname.indexOf('/', 1)) };
}

function getProducts(json, language) {
  return json.Product.data
    .filter((entry) => entry.Languages.split('|')
      .some((productLanguage) => productLanguage.toUpperCase() === language.toUpperCase()))
    .map((product) => {
      const translation = json.ProductTranslation.data
        .find((entry) => entry.ProductRef === product.ProductCodes
          && entry.Language === language);
      if (translation) {
        if (translation.Name) {
          product.Name = translation.Name;
        }
        if (translation.Image) {
          product.Image = translation.Image;
        }
      }
      return product;
    });
}

function decorateProduct(product) {
  const result = {
    type: 'a',
    classes: ['product'],
    attributes: { href: `product-support/${product.ProductCodes.split('|')[0]}` },
    children: [
      {
        type: 'h3',
        textContent: product.Name,
      },
    ],
  };

  if (product.Image) {
    result.children = [
      {
        type: 'div',
        classes: ['container'],
        children: [
          {
            type: 'img',
            attributes: { src: product.Image },
          },
        ],
      }, ...result.children,
    ];
  }

  return result;
}

export default async function decorate(block) {
  const resp = await fetch('/products.json?limit=10000');
  if (!resp.ok) {
    throw new Error(`${resp.status}: ${resp.statusText}`);
  }

  const json = await resp.json();
  const { language } = getInfo();
  const products = getProducts(json, language);

  createDomStructure([
    {
      type: 'div',
      classes: ['product-list'],
      children: products.map(decorateProduct),
    }], block);
}
