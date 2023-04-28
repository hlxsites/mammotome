import { createDomStructure } from '../../scripts/lib-franklin.js';

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
export default async function decorate(block) {
  const resp = await fetch('/kp-test.json?limit=10000');
  if (!resp.ok) {
    throw new Error(`${resp.status}: ${resp.statusText}`);
  }

  const { productCode, productSupport, language } = getInfo();

  const json = await resp.json();

  const product = json.Product.data.find((entry) => entry.ProductCodes.split('|').some((code) => code === productCode) && entry.Languages.split('|').some((productLanguage) => productLanguage.toUpperCase() === language.toUpperCase()));

  if (!product) {
    window.location.replace(productSupport);
    return;
  }

  const assets = json.ProductAsset.data.filter((asset) => asset.ProductRef === product.ProductCodes && asset.Languages.split('|').some((assetLanguage) => assetLanguage.toUpperCase() === language.toUpperCase()));
  const elements = [];
  elements.push({ type: 'h1', textContent: product.Name });
  if (product.Image) {
    elements.push({ type: 'img', attributes: { src: product.Image } });
  }
  elements.push(
    {
      type: 'div',
      children: [
        {
          type: 'h2',
          textContent: 'Product and Technical documents',
        },
        {
          type: 'div',
          children: [
            {
              type: 'select',
              children: [
                {
                  type: 'option',
                  textContent: 'All Product Documents',
                },
                {
                  type: 'option',
                  textContent: 'Brochure',
                },
                {
                  type: 'option',
                  textContent: 'White Paper',
                },
                {
                  type: 'option',
                  textContent: 'Case Study',
                },
                {
                  type: 'option',
                  textContent: 'Highlight',
                },
                {
                  type: 'option',
                  textContent: 'Technical Document',
                },
              ],
            },
          ],
        },
      ].concat(
        assets.length > 0
          ? assets.map((asset) => ({
            type: 'a',
            attributes: { href: asset.URL, target: 'blank' },
            textContent: asset.Name,
          }))
          : {
            type: 'div',
            textContent: 'No data was found',
          },
      ),
    },
  );
  createDomStructure(elements, block);
}
