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
    .find((entry) => entry.ProductCodes.split('|')
      .some((code) => code === productCode)
        && entry.Languages.split('|')
          .some((productLanguage) => productLanguage.toUpperCase() === language.toUpperCase()));

  if (product) {
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
  }

  return product;
}

function getTypes(json, product, language) {
  return json.ProductAsset.data
    .filter((asset) => asset.ProductRef === product.ProductCodes && asset.Languages
      .split('|').some((assetLanguage) => assetLanguage.toUpperCase() === language.toUpperCase()))
    .map((asset) => asset.Type)
    .filter((value, index, array) => array.indexOf(value) === index);
}

function getAssets(json, product, language, type, allType) {
  return json.ProductAsset.data
    .filter((asset) => asset.ProductRef === product.ProductCodes && asset.Languages
      .split('|').some((assetLanguage) => assetLanguage.toUpperCase() === language.toUpperCase())
      && (type === allType || asset.Type === type));
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

  const heading = await translate('productSupportHeading', 'Product and Technical documents');
  const allDocuments = await translate('productSupportAllDocuments', 'All Product Documents');
  const empty = await translate('productSupportNoResult', 'No data was found');

  createDomStructure([{ type: 'h1', textContent: product.Name }], block);
  if (product.Image) {
    createDomStructure([{ type: 'img', attributes: { src: product.Image } }], block);
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
              ].concat(
                getTypes(json, product, language)
                  .map((type) => (
                    {
                      type: 'option',
                      textContent: type,
                    }
                  )),
              ),
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
