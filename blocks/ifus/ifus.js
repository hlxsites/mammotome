import { createDomStructure, translate } from '../../scripts/lib-franklin.js';

async function handleSearch(selectors, allSelectors) {
  selectors.result.innerHTML = '';
  createDomStructure([{
    type: 'h4',
    textContent: await translate('ifuSearchTitle', 'Search results'),
  }], selectors.result);

  allSelectors.filter((entry) => entry !== selectors)
    .flatMap((entry) => [entry.code, entry.country])
    .forEach((value) => { value.options[0].selected = true; });

  selectors.result.classList.remove('no-result');

  const assets = selectors.code.value && selectors.country.value
    ? selectors.assetFilter(selectors.code, selectors.country) : [];

  if (assets.length === 0) {
    createDomStructure([{
      type: 'div',
      children: [{ type: 'strong', textContent: await translate('ifuSearchNoResult', 'No result') }],
    }], selectors.result);
    return;
  }

  const map = new Map();
  assets.forEach((asset) => {
    if (map.has(asset.Title)) {
      const links = map.get(asset.Title);
      links.push(asset.URL);
    } else {
      map.set(asset.Title, [asset.URL]);
    }
  });

  await Promise.all(Array.from(map).map(async ([key, value]) => {
    createDomStructure([
      {
        type: 'div',
        children: [
          { type: 'h5', textContent: key },
          {
            type: 'div',
            children: [
              {
                type: 'div',
                children: [
                  {
                    type: 'div',
                    textContent: selectors.productProducer(selectors.code),
                    children: [{
                      type: 'h6',
                      position: 'prepend',
                      textContent: await translate('ifuSearchProductCodes', 'Product Code(s)'),
                    }],
                  },
                ],
              },
              {
                type: 'div',
                textContent: selectors.country.value,
                children: [{
                  type: 'h6',
                  position: 'prepend',
                  textContent: await translate('ifuSearchCountrySelected', 'Country Selected'),
                }],
              },
              {
                type: 'div',
                children: value.map(
                  (link) => ({
                    type: 'a',
                    attributes: { href: link, target: 'blank' },
                    children: [{ type: 'button', textContent: link.substring(link.lastIndexOf('/') + 1) }],
                  }),
                ),
              },
            ],
          },
        ],
      },
    ], selectors.result);
  }));
}

function populateSearch(selectors, allSelectors) {
  const createOptions = (items, selector, text, attributes) => {
    createDomStructure(
      items.map((item) => ({ type: 'option', textContent: text?.(item) || item, attributes: attributes?.(item) })),
      selector,
    );
    selector.disabled = false;
  };

  createOptions(selectors.idMap(), selectors.code);

  createOptions(
    selectors.countryMap(),
    selectors.country,
    (country) => country['Country Name'],
    (country) => ({ value: country.ISO_3166_1_alpha_2_code }),
  );

  selectors.search.disabled = false;
  selectors.search.addEventListener('click', async () => handleSearch(selectors, allSelectors));
}

async function populate(block) {
  const resp = await fetch('/en/dj-test.json?limit=10000');
  if (!resp.ok) {
    throw new Error(`${resp.status}: ${resp.statusText}`);
  }

  const json = await resp.json();

  const getSelectors = (prefix, idMap, assetFilter, productProducer) => ({
    code: block.querySelector(`#${prefix}-code`),
    country: block.querySelector(`#${prefix}-country`),
    search: block.querySelector(`#${prefix}-code-search`),
    result: block.querySelector('.ifu-result'),
    idMap,
    countryMap: () => json.countries.data,
    assetFilter,
    productProducer,
  });

  const selectors = [
    getSelectors(
      'eIFU',
      () => json.eIFUs.data.map((value) => value.ID),
      (idSelector, countrySelector) => json.IFUAssets.data.filter(
        (asset) => asset.eIFU === idSelector.value && asset.Country === countrySelector.value,
      ),
      (idSelector) => json.eIFUToProductCodes.data
        .filter((match) => match.eIFU_ID === idSelector.value)
        .map((match) => match['Product Code']).join(', '),
    ),
    getSelectors(
      'udi',
      () => json.UDIs.data.map((value) => value.Code),
      (idSelector, countrySelector) => json.eIFUToUDIs.data
        .filter((entry) => entry.UDI_DI === idSelector.value)
        .flatMap((entry) => json.IFUAssets.data
          .filter((asset) => asset.eIFU === entry.eIFU && asset.Country === countrySelector.value)),
      (idSelector) => json.UDIToProductCodes.data
        .filter((match) => match.UDI_DI === idSelector.value)
        .map((match) => match['Product Code']).join(', '),
    ),
    getSelectors(
      'product',
      () => json.productCodes.data.map((value) => value.Code),
      (idSelector, countrySelector) => json.eIFUToProductCodes.data
        .filter((entry) => entry['Product Code'] === idSelector.value)
        .flatMap((entry) => json.IFUAssets.data
          .filter((asset) => asset.eIFU === entry.eIFU_ID
            && asset.Country === countrySelector.value)),
      (idSelector) => json.eIFUToProductCodes.data
        .filter((match) => match['Product Code'] === idSelector.value)
        .flatMap((match) => json.eIFUToProductCodes.data
          .filter((innerMatch) => innerMatch.eIFU_ID === match.eIFU_ID)
          .map((innerMatch) => innerMatch['Product Code'])).join(', '),
    ),
  ];

  selectors.forEach((selector) => populateSearch(selector, selectors));
}

export default async function decorate(block) {
  createDomStructure([
    {
      type: 'div',
      classes: ['ifu-result', 'no-result'],
      children: [{ type: 'h4', textContent: await translate('ifuSearchTitle', 'Search results') }],
    },
    {
      type: 'div',
      classes: ['ifu'],
      children: await Promise.all([['eIFU', 'eIFU'], ['udi', 'UDI'], ['product', 'Product Code']].map(async (entry) => (
        {
          type: 'div',
          classes: ['ifu-selection'],
          children: [
            {
              type: 'h5',
              classes: ['ifu-title'],
              textContent: await translate(`ifuSearchBy${entry[0]}`, `Search by ${entry[1]}`),
            },
            {
              type: 'select',
              attributes: { id: `${entry[0]}-code`, name: `Select ${entry[1]}`, disabled: true },
              children: [
                {
                  type: 'option',
                  attributes: { hidden: true, disabled: true, selected: true },
                  textContent: await translate(`ifuSelect${entry[0]}`, `Select ${entry[1]}`),
                },
              ],
            },
            {
              type: 'select',
              attributes: { id: `${entry[0]}-country`, name: 'Select Country', disabled: true },
              children: [
                {
                  type: 'option',
                  attributes: { hidden: true, disabled: true, selected: true },
                  textContent: await translate('ifuSelectCountry', 'Select Country'),
                },
              ],
            },
            {
              type: 'button',
              attributes: { id: `${entry[0]}-code-search`, disabled: true },
              textContent: await translate('ifuSearch', 'Search'),
            },
          ],
        }))),
    },
  ], block);

  populate(block);
}
