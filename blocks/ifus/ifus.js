import { translate } from '../../scripts/lib-franklin.js';

function createDomStructure(structure, parentElement = document.body) {
  structure.forEach((element) => {
    const domElement = document.createElement(element.type);
    if (element.attributes) {
      Object.keys(element.attributes).forEach((attr) => {
        domElement.setAttribute(attr, element.attributes[attr]);
      });
    }

    if (element.textContent) {
      domElement.textContent = element.textContent;
    }

    if (element.children) {
      createDomStructure(element.children, domElement);
    }

    if (element.classes) {
      element.classes.forEach((c) => domElement.classList.add(c));
    }

    if (element.position === 'prepend') {
      parentElement.prepend(domElement);
    } else {
      parentElement.appendChild(domElement);
    }
  });
}

function populateSearch(
  idSelector,
  countrySelector,
  searchButton,
  result,
  idProducer,
  countryProducer,
  assetFilter,
  productCodes,
  clear,
) {
  idProducer().forEach((value) => {
    createDomStructure([{ type: 'option', textContent: value }], idSelector);
  });
  idSelector.disabled = false;

  countryProducer().forEach((country) => {
    createDomStructure([
      { type: 'option', attributes: { value: country.ISO_3166_1_alpha_2_code }, textContent: country['Country Name'] },
    ], countrySelector);
  });
  countrySelector.disabled = false;

  searchButton.disabled = false;
  searchButton.addEventListener('click', async () => {
    clear.forEach((value) => { value.options[0].selected = true; });
    const assets = idSelector.value && countrySelector.value
      ? assetFilter(idSelector, countrySelector) : [];
    result.innerHTML = '';
    createDomStructure([{ type: 'h4', textContent: await translate('ifuSearchTitle', 'Search results') }], result);
    if (assets.length === 0) {
      createDomStructure([{ type: 'div', children: [{ type: 'strong', textContent: await translate('ifuSearchNoResult', 'No result') }] }], result);
    } else {
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
                    children:
                      [
                        {
                          type: 'div',
                          textContent: productCodes(idSelector),
                          children:
                            [
                              { type: 'h6', position: 'prepend', textContent: await translate('ifuSearchProductCodes', 'Product Code(s)') },
                            ],
                        },
                      ],
                  },
                  {
                    type: 'div',
                    textContent: countrySelector.value,
                    children:
                      [
                        { type: 'h6', position: 'prepend', textContent: await translate('ifuSearchCountrySelected', 'Country Selected') },
                      ],
                  },
                  {
                    type: 'div',
                    children: value.map(
                      (link) => ({
                        type: 'a', attributes: { href: link, target: 'blank' }, children: [{ type: 'button', textContent: link.substring(link.lastIndexOf('/') + 1) }],
                      }),
                    ),
                  },
                ],
              }],
          },
        ], result);
      }));
    }
    result.classList.remove('no-result');
  });
}

async function populate(block) {
  const resp = await fetch('/en/dj-test.json?limit=10000');
  if (resp.ok) {
    const json = await resp.json();
    const eIFUCode = block.querySelector('#eIFU-code');
    const eIFUCountry = block.querySelector('#eIFU-country');
    const eIFUSearch = block.querySelector('#eIFU-code-search');
    const udiCode = block.querySelector('#udi-code');
    const udiCountry = block.querySelector('#udi-country');
    const udiSearch = block.querySelector('#udi-code-search');
    const productCode = block.querySelector('#product-code');
    const productCountry = block.querySelector('#product-country');
    const productSearch = block.querySelector('#product-code-search');
    const result = block.querySelector('.ifu-result');

    populateSearch(
      eIFUCode,
      eIFUCountry,
      eIFUSearch,
      result,
      () => json.eIFUs.data.map((value) => value.ID),
      () => json.countries.data,
      (idSelector, countrySelector) => json.IFUAssets.data.filter(
        (asset) => asset.eIFU === idSelector.value && asset.Country === countrySelector.value,
      ),
      (idSelector) => json.eIFUToProductCodes.data
        .filter((match) => match.eIFU_ID === idSelector.value)
        .map((match) => match['Product Code']).join(', '),
      [udiCode, udiCountry, productCode, productCountry],
    );

    populateSearch(
      udiCode,
      udiCountry,
      udiSearch,
      result,
      () => json.UDIs.data.map((value) => value.Code),
      () => json.countries.data,
      (idSelector, countrySelector) => json.eIFUToUDIs.data
        .filter((entry) => entry.UDI_DI === idSelector.value)
        .flatMap((entry) => json.IFUAssets.data
          .filter((asset) => asset.eIFU === entry.eIFU && asset.Country === countrySelector.value)),
      (idSelector) => json.UDIToProductCodes.data
        .filter((match) => match.UDI_DI === idSelector.value)
        .map((match) => match['Product Code']).join(', '),
      [eIFUCode, eIFUCountry, productCode, productCountry],
    );

    populateSearch(
      productCode,
      productCountry,
      productSearch,
      result,
      () => json.productCodes.data.map((value) => value.Code),
      () => json.countries.data,
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
      [eIFUCode, eIFUCountry, udiCode, udiCountry],
    );
  } else {
    throw new Error(`${resp.status}: ${resp.statusText}`);
  }
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
