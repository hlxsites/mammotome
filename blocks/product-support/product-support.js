import { createDomStructure, translate } from '../../scripts/lib-franklin.js';

function getInfo() {
  const url = new URL(window.location);
  const idx = url.pathname.indexOf('/product-support/');
  if (idx > 0) {
    const slug = url.pathname.substring(url.pathname.indexOf('/product-support/') + '/product-support/'.length);
    if (slug) {
      return {
        productCode: slug,
        productSupport: url.pathname.substring(0, url.pathname.indexOf(`${slug}`)),
        language: url.pathname.substring(1, url.pathname.indexOf('/', 1)),
      };
    }
  }
  return { productSupport: url.pathname.substring(0, url.pathname.length - 1) };
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

function getTypes(json, product, language) {
  const languageUpper = language.toUpperCase();

  return Array.from(
    new Set(
      json.ProductAsset.data.filter(
        (asset) => asset.ProductRef === product.ProductCodes
          && asset.Languages.split('|').map((lang) => lang.toUpperCase()).includes(languageUpper),
      ).map((asset) => asset.Type),
    ),
  );
}

function getAssets(json, product, language, type, allType) {
  const languageUpper = language.toUpperCase();

  return json.ProductAsset.data.filter(
    (asset) => asset.ProductRef === product.ProductCodes
      && asset.Languages.split('|').map((lang) => lang.toUpperCase()).includes(languageUpper)
      && (type === allType || asset.Type === type),
  );
}

export default async function decorate(block) {
  const resp = await fetch('/products.json?limit=10000');
  if (!resp.ok) {
    throw new Error(`${resp.status}: ${resp.statusText}`);
  }

  const { productCode, productSupport, language } = getInfo();

  const json = await resp.json();

  const product = getProduct(json, productCode, language);

  if (!product) {
    window.location.replace(productSupport);
    return;
  }

  const [heading, allDocuments, empty] = await Promise.all([
    translate('productSupportHeading', 'Product and Technical documents'),
    translate('productSupportAllDocuments', 'All Product Documents'),
    translate('productSupportNoResult', 'No data was found'),
  ]);

  createDomStructure([{ type: 'h1', textContent: product.Name }], block);
  if (product.Image) {
    createDomStructure([{ type: 'div', classes: ['container'], children: [{ type: 'img', attributes: { src: product.Image } }] }], block);
  }
  createDomStructure([
    {
      type: 'div',
      children: [
        {
          type: 'h2',
          textContent: heading,
        },
        {
          type: 'div',
          children: [
            {
              type: 'select',
              children: [
                {
                  type: 'option',
                  textContent: allDocuments,
                },
                ...getTypes(json, product, language)
                  .map((type) => (
                    {
                      type: 'option',
                      textContent: type,
                    }
                  )),
              ],
            },
          ],
        },
        {
          type: 'div',
          classes: ['link-container'],
        },
      ],
    },
  ], block);

  const select = block.querySelector('select');
  const container = block.querySelector('.link-container');

  const handler = () => {
    container.innerHTML = '';
    const assets = getAssets(json, product, language, select.value, allDocuments);

    if (assets.length > 0) {
      createDomStructure(assets.map((asset) => (
        {
          type: 'div',
          classes: ['link'],
          children: [
            {
              type: 'a',
              attributes: { href: asset.URL, target: 'blank' },
              textContent: asset.Name,
            },
          ],
        }
      )), container);
    } else {
      createDomStructure([{
        type: 'div',
        textContent: empty,
      }], container);
    }
  };

  handler();
  select.addEventListener('change', handler);
}
