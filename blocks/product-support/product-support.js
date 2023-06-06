import {
  createDomStructure, decorateBlockImgs, getProduct, translate, decorateSupScript,
} from '../../scripts/lib-franklin.js';

function getInfo() {
  const url = new URL(window.location);
  const idx = url.pathname.indexOf('/product-support/');
  if (idx > 0) {
    const slug = url.pathname.substring(url.pathname.indexOf('/product-support/') + '/product-support/'.length);
    if (slug) {
      const [, country, language] = url.pathname.split('/');
      return {
        country,
        page: slug,
        productSupport: url.pathname.substring(0, url.pathname.indexOf(`${slug}`) - 1),
        language,
      };
    }
  }
  return { productSupport: url.pathname.substring(0, url.pathname.length - 1) };
}

function getTypes(product) {
  return Array.from(new Set(product.assets.map((asset) => asset.Type)));
}

function getAssets(product, type, allType) {
  return product.assets.filter((asset) => (type === allType || asset.Type === type));
}

export default async function decorate(block) {
  const {
    country, page, productSupport, language,
  } = getInfo();

  const product = await getProduct(page, country, language);

  if (!product) {
    window.location.replace(productSupport);
    return;
  }

  const [heading, allDocuments, empty] = await Promise.all([
    translate('productSupportHeading', 'Product and Technical documents'),
    translate('productSupportAllDocuments', 'All Product Documents'),
    translate('productSupportNoResult', 'No data was found'),
  ]);

  createDomStructure([{ type: 'h1', children: decorateSupScript(product.Name) }], block);
  if (product.Image) {
    createDomStructure([{ type: 'div', classes: ['container'], children: [{ type: 'img', attributes: { src: product.Image } }] }], block);
    decorateBlockImgs(block);
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
                ...getTypes(product)
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
    const assets = getAssets(product, select.value, allDocuments);

    if (assets.length > 0) {
      createDomStructure(assets.map((asset) => (
        {
          type: 'div',
          classes: ['link'],
          children: [
            {
              type: 'a',
              attributes: { href: asset.URL, target: 'blank' },
              children: decorateSupScript(asset.Name),
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
