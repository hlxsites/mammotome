import { createDomStructure, getProductDB, translate } from '../../scripts/lib-franklin.js';

function getInfo() {
  const url = new URL(window.location);
  return { language: url.pathname.substring(1, url.pathname.indexOf('/', 1)) };
}

function getProduct(json, productCode, language) {
  const product = json.Product.data
    .find((entry) => entry.ProductCodes.split('|').includes(productCode)
      && entry.Languages.split('|').map((lang) => lang.toUpperCase()).includes(language.toUpperCase()));

  if (product) {
    const translation = json.ProductTranslation.data
      .find((entry) => entry.ProductRef === product.ProductCodes && entry.Language === language);

    product.Name = translation?.Name || product.Name;
    product.Image = translation?.Image || product.Image;
  }

  return product;
}

export default async function decorate(block) {
  const productCode = block.querySelector('div > div')?.textContent?.trim();
  block.innerHTML = '';
  if (!productCode) {
    return;
  }
  const { language } = getInfo();
  const json = await getProductDB();
  const product = getProduct(json, productCode, language);

  if (!product) {
    return;
  }

  createDomStructure([{
    type: 'div',
    children: [
      {
        type: 'div',
        classes: ['product-ref-container'],
        children: [
          {
            type: 'div',
            children: [
              {
                type: 'img',
                attributes: { src: product.Image },
              },
            ],
          },
        ],
      },
      {
        type: 'div',
        classes: ['product-ref-container'],
        children: [
          {
            type: 'div',
            children: [{
              type: 'a',
              attributes: { href: '../contact/' },
              children: [
                {
                  type: 'button',
                  classes: ['primary'],
                  textContent: await translate('productReferenceInformation', 'Request Information'),
                },
              ],
            },
            {
              type: 'a',
              attributes: { href: '../product-support' },
              children: [
                {
                  type: 'button',
                  classes: ['secondary'],
                  textContent: await translate('productReferenceSupport', 'Product Support'),
                },
              ],
            },
            {
              type: 'a',
              attributes: { href: `../product-support/${product.ProductCodes.split('|')[0]}` },
              children: [
                {
                  type: 'button',
                  classes: ['secondary'],
                  textContent: await translate('productReferenceDocuments', 'Product Documents'),
                },
              ],
            }],
          },
        ],
      },
    ],
  }], block);
}
