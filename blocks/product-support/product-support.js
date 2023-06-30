import {
  createDomStructure,
  decorateBlockImgs,
  getProduct,
  translate,
  decorateSupScript,
  getInfo,
  decorateButtons,
  loadBlock,
  decorateBlock,
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

function parseYoutubeCode(url) {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : false;
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

  const [heading, headingVideos, allDocuments, empty] = await Promise.all([
    translate('productSupportHeading', 'Product and Technical Documents'),
    translate('productSupportHeadingVideos', 'Instructional Videos'),
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
    const assets = getAssets(product, select.value, allDocuments)
      .filter((asset) => !parseYoutubeCode(asset.URL));

    if (assets.length > 0) {
      createDomStructure(assets.map((asset) => (
        {
          type: 'div',
          classes: ['link', 'button-container'],
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

  const videoAssets = getAssets(product, allDocuments, allDocuments)
    .filter((asset) => parseYoutubeCode(asset.URL));

  if (videoAssets.length > 0) {
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
                textContent: headingVideos,
              },
            ],
          },
          {
            type: 'div',
            classes: ['link-container'],
            children: videoAssets.map((asset) => (
              {
                type: 'div',
                classes: ['video', 'link'],
                children: [
                  {
                    type: 'div',
                    children: [
                      {
                        type: 'div',
                        children: [
                          {
                            type: 'h5',
                            children: [
                              {
                                type: 'strong',
                                children: decorateSupScript(asset.Name),
                              },
                            ],
                          },
                        ],
                      },
                      {
                        type: 'div',
                        children: [
                          {
                            type: 'a',
                            attributes: { href: `https://www.youtu.be/${parseYoutubeCode(asset.URL)}` },
                          },
                        ],
                      },
                      {
                        type: 'div',
                        children: [
                          {
                            type: 'img',
                            attributes: { src: `https://img.youtube.com/vi/${parseYoutubeCode(asset.URL)}/sddefault.jpg` },
                          },
                        ],
                      },
                    ],
                  },
                ],
              }
            )),
          },
        ],
      },
    ], block);
    await Promise.all(Array.from(block.querySelectorAll('.video')).map(async (video) => {
      decorateBlock(video);
      await loadBlock(video);
    }));
  }

  handler();
  select.addEventListener('change', handler);
}
