import { createDomStructure, getProductDB, translate } from '../../scripts/lib-franklin.js';

async function handleSearch(selectors, allSelectors) {
  const { result, code, country } = selectors;

  result.innerHTML = '';
  createDomStructure([{
    type: 'h4',
    textContent: await translate('ifuSearchTitle', 'Search results'),
  }], result);

  allSelectors.filter((entry) => entry !== selectors)
    .flatMap((entry) => [entry.code, entry.country])
    .forEach((value) => { value.options[0].selected = true; });

  result.classList.remove('no-result');

  const assets = code.value && country.value
    ? selectors.assets(code.value, country.value) : [];

  if (assets.length === 0) {
    createDomStructure([{
      type: 'div',
      children: [{ type: 'strong', textContent: await translate('ifuSearchNoResult', 'No result') }],
    }], result);
    return;
  }

  const assetMap = new Map();
  const revisionedAssetMap = new Map();

  assets.forEach((asset) => {
    if (!asset.URL) {
      return;
    }

    const map = asset.Revised ? revisionedAssetMap : assetMap;
    const url = new URL(asset.URL, window.location.href);

    if (url.hostname.endsWith('-mammotome--hlxsites.hlx.page')
      || url.hostname.endsWith('-mammotome--hlxsites.hlx.live')
      || url.hostname === 'localhost') {
      asset.URL = url.pathname;
    }

    if (map.has(asset.Title)) {
      const links = map.get(asset.Title);
      links.push(asset.URL);
    } else {
      map.set(asset.Title, [asset.URL]);
    }
  });

  async function createAssetDomStructure([key, value]) {
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
                    textContent: selectors.productCodes(code.value),
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
                textContent: country.value,
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
    ], result);
  }

  await Promise.all(Array.from(assetMap).map(createAssetDomStructure));

  if (revisionedAssetMap.size === 0) {
    return;
  }

  createDomStructure([{
    type: 'h4',
    textContent: await translate('ifuSearchRevisionedTitle', 'Past Revisions of Instructions for Use'),
  }], result);

  await Promise.all(Array.from(revisionedAssetMap).map(createAssetDomStructure));
}

function populateSearch(selectors, allSelectors) {
  const createOptions = (items, selector, text, attributes) => {
    createDomStructure(
      items.map((item) => ({ type: 'option', textContent: text?.(item) || item, attributes: attributes?.(item) })),
      selector,
    );
    selector.disabled = false;
  };

  createOptions(selectors.ids(), selectors.code);

  createOptions(
    selectors.countries(),
    selectors.country,
    (country) => country['Country Name'],
    (country) => ({ value: country.ISO_3166_1_alpha_2_code }),
  );

  selectors.search.disabled = false;
  selectors.search.addEventListener('click', async () => handleSearch(selectors, allSelectors));
}

async function populate(block) {
  const json = await getProductDB();

  const getSelectors = (prefix, ids, assets, productCodes) => ({
    code: block.querySelector(`#${prefix}-code`),
    country: block.querySelector(`#${prefix}-country`),
    search: block.querySelector(`#${prefix}-code-search`),
    result: block.querySelector('.ifu-result'),
    ids,
    countries: () => json.Countries.data,
    assets,
    productCodes,
  });

  const unique = (value, index, array) => array.indexOf(value) === index;

  const getIFUIDs = () => json.eIFU.data.map((value) => value.eIFU).filter(unique).sort();

  const getProductCodeIDs = () => json.eIFU.data.flatMap((value) => value.ProductCodes.split('|')).filter(unique).sort();

  const getProductCodesByIFU = (id) => json.eIFU.data
    .filter((match) => match.eIFU === id)
    .flatMap((match) => match.ProductCodes.split('|'))
    .filter(unique)
    .sort()
    .join(', ');

  const getProductCodesByProductCode = (id) => json.eIFU.data
    .filter((match) => match.ProductCodes.split('|').includes(id))
    .flatMap((match) => match.ProductCodes.split('|'))
    .filter(unique)
    .sort()
    .join(', ');

  const getAssetbyIFUandCountry = (id, country) => json.eIFU.data.filter(
    (asset) => asset.eIFU === id && ((asset.Countries === '') || asset.Countries.split('|').includes(country)),
  );

  const getAssetsByProductCodeandCountry = (id, country) => json.eIFU.data
    .filter((entry) => entry.ProductCodes.split('|').includes(id) && ((entry.Countries === '') || entry.Countries.split('|').includes(country)));

  const selectors = [
    getSelectors(
      'eIFU',
      getIFUIDs,
      getAssetbyIFUandCountry,
      getProductCodesByIFU,
    ),
    getSelectors(
      'product',
      getProductCodeIDs,
      getAssetsByProductCodeandCountry,
      getProductCodesByProductCode,
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
      children: await Promise.all([['eIFU', 'eIFU'], ['product', 'Product Code']].map(async (entry) => (
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
