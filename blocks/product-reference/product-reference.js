import {
  createDomStructure, decorateBlockImgs, getProduct, translate,
} from '../../scripts/lib-franklin.js';

function getInfo() {
  const [, country, language] = window.location.pathname.split('/');
  return { country, language };
}

async function createButtons(productCode) {
  return [
    [
      await translate('productReferenceInformationURL', '../contact/'),
      ['primary'],
      await translate('productReferenceInformation', 'Request Information'),
    ],
    [
      await translate('productReferenceSupportURL', '../product-support'),
      ['secondary'],
      await translate('productReferenceSupport', 'Product Support'),
    ],
    [
      `${await translate('productReferenceSupportURL', '../product-support')}/${productCode}`,
      ['secondary'],
      await translate('productReferenceDocuments', 'Product Documents'),
    ],
  ].map(([href, className, textContent]) => ({ href, className, textContent }));
}

export default async function decorate(block) {
  const page = block.querySelector('div > div')?.textContent?.trim();

  block.innerHTML = '';

  if (!page) {
    return;
  }

  const { country, language } = getInfo();

  const product = await getProduct(page, country, language);

  if (!product) {
    return;
  }

  const buttons = await createButtons(product.Page);

  const imgStructure = [
    {
      type: 'img',
      attributes: { src: product.Image },
    },
  ];

  const buttonStructure = buttons.map(({ href, className, textContent }) => ({
    type: 'a',
    attributes: { href },
    children: [{ type: 'button', classes: [className], textContent }],
  }));

  createDomStructure([
    {
      type: 'div',
      children: [
        imgStructure,
        buttonStructure,
      ].map((children) => (
        {
          type: 'div',
          classes: ['product-ref-container'],
          children: [
            {
              type: 'div',
              children,
            },
          ],
        })),
    },
  ], block);
  decorateBlockImgs(block);
}
