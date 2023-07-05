import {
  createDomStructure, decorateBlockImgs, getInfo, getProduct, translate,
} from '../../scripts/lib-franklin.js';

async function createButtons(country, language, productCode) {
  return [
    [
      await translate('productReferenceInformationUrl', '../contact/'),
      ['primary'],
      await translate('productReferenceInformation', 'Request Information'),
    ],
    [
      await translate('productReferenceSupportUrl', '../product-support'),
      ['secondary'],
      await translate('productReferenceSupport', 'Product Support'),
    ],
    [
      `/${country}/${language}/${await translate('productReferenceSupportUrl', 'product-support')}/${productCode}`,
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

  const buttons = await createButtons(country, language, product.Page);

  const imgStructure = [
    {
      type: 'img',
      attributes: { src: product.Image, alt: product.Name },
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
