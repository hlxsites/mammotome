import {
  createDomStructure,
  decorateBlockImgs,
  getProduct,
  translate,
  decorateSupScript,
  getInfo,
  decorateButtons,
} from '../../scripts/lib-franklin.js';

function getProductSupportInfo() {
  const info = getInfo();
  const url = new URL(window.location);
  const idx = url.pathname.indexOf('/product-support/');
  if (idx > 0) {
    const page = url.pathname.substring(url.pathname.indexOf('/product-support/') + '/product-support/'.length);
    return { page, ...info };
  }
  return info;
}

function getTypes(product) {
  return Array.from(new Set(product.assets.map((asset) => asset.Type).filter((type) => type)));
}

function getAssets(product, type, allType) {
  return product.assets.filter((asset) => (type === allType || asset.Type === type));
}

export default async function decorate(block) {
  const {
    country, page, productSupport, language,
  } = getProductSupportInfo();

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
  const types = getTypes(product);
  createDomStructure([
    {
      type: 'div',
      classes: ['header-wide'],
      children: [
        {
          type: 'h4',
          children: [
            {
              type: 'strong',
              textContent: heading,
            },
          ],
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
                ...types
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
  if (types.length === 0) {
    select.style.display = 'none';
  }
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
      decorateButtons(container);
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
