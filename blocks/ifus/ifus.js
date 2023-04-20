import { translate } from '../../scripts/lib-franklin.js';

function buildTags(tags) {
  return tags.map((tag) => {
    const element = document.createElement(tag.name);
    if (tag.text) {
      element.textContent = tag.text;
    }
    if (tag.next) {
      element.append(...buildTags(tag.next));
    }
    if (tag.first) {
      element.prepend(...buildTags(tag.first));
    }
    if (tag.href) {
      element.href = tag.href;
    }
    if (tag.target) {
      element.target = tag.target;
    }
    if (tag.class) {
      element.classList.add(tag.class);
    }
    if (tag.classes) {
      tag.classes.forEach((c) => element.classList.add(c));
    }
    if (tag.id) {
      element.id = tag.id;
    }
    return element;
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
    const option = document.createElement('option');
    option.text = value;
    idSelector.append(option);
  });
  idSelector.disabled = false;

  countryProducer().forEach((country) => {
    const option = document.createElement('option');
    option.text = country['Country Name'];
    option.value = country.ISO_3166_1_alpha_2_code;
    countrySelector.append(option);
  });
  countrySelector.disabled = false;

  searchButton.disabled = false;
  searchButton.addEventListener('click', async () => {
    clear.forEach((value) => { value.options[0].selected = true; });
    const assets = idSelector.value && countrySelector.value
      ? assetFilter(idSelector, countrySelector) : [];
    result.innerHTML = '';
    result.append(...buildTags([{ name: 'h4', text: await translate('ifuSearchTitle', 'Search results') }]));
    if (assets.length === 0) {
      result.append(...buildTags([{ name: 'div', next: [{ name: 'strong', text: await translate('ifuSearchNoResult', 'No result') }] }]));
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
        const entry = buildTags(
          [
            {
              name: 'div',
              next: [{ name: 'h5', text: key },
                {
                  name: 'div',
                  next: [
                    {
                      name: 'div',
                      next:
                        [
                          {
                            name: 'div',
                            text: productCodes(idSelector),
                            first:
                              [
                                { name: 'h6', text: await translate('ifuSearchProductCodes', 'Product Code(s)') },
                              ],
                          },
                        ],
                    },
                    {
                      name: 'div',
                      text: countrySelector.value,
                      first:
                        [
                          { name: 'h6', text: await translate('ifuSearchCountrySelected', 'Country Selected') },
                        ],
                    },
                    {
                      name: 'div',
                      next: value.map(
                        (link) => ({
                          name: 'a', href: link, target: 'blank', next: [{ name: 'button', text: link.substring(link.lastIndexOf('/') + 1) }],
                        }),
                      ),
                    },
                  ],
                }],
            },
          ],
        );
        result.append(...entry);
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
  block.append(...buildTags([
    {
      name: 'div',
      classes: ['ifu-result', 'no-result'],
      next: [{ name: 'h4', text: await translate('ifuSearchTitle', 'Search results') }],
    },
    {
      name: 'div',
      class: 'ifu',
      next: [
        {
          name: 'div',
          class: 'ifu-selection',
          next: [
            {
              name: 'h5',
              class: 'ifu-title',
              text: await translate('ifuSearchByIFU', 'Search by eIFU'),
            },
            {
              name: 'select',
              id: 'eIFU-code',
              next: [
                {
                  name: 'option',
                  text: await translate('ifuSelectIFU', 'Select eIFU'),
                },
              ],
            },
            {
              name: 'select',
              id: 'eIFU-country',
              next: [
                {
                  name: 'option',
                  text: await translate('ifuSelectCountry', 'Select Country'),
                },
              ],
            },
            {
              name: 'button',
              id: 'eIFU-code-search',
              text: await translate('ifuSearch', 'Search'),
            },
          ],
        },
        {
          name: 'div',
          class: 'ifu-selection',
          next: [
            {
              name: 'h5',
              class: 'ifu-title',
              text: await translate('ifuSearchByUDI', 'Search by UDI'),
            },
            {
              name: 'select',
              id: 'udi-code',
              next: [
                {
                  name: 'option',
                  text: await translate('ifuSelectUDI', 'Select UDI'),
                },
              ],
            },
            {
              name: 'select',
              id: 'udi-country',
              next: [
                {
                  name: 'option',
                  text: await translate('ifuSelectCountry', 'Select Country'),
                },
              ],
            },
            {
              name: 'button',
              id: 'udi-code-search',
              text: await translate('ifuSearch', 'Search'),
            },
          ],
        },
        {
          name: 'div',
          class: 'ifu-selection',
          next: [
            {
              name: 'h5',
              class: 'ifu-title',
              text: await translate('ifuSearchByProductCode', 'Search by Product Code'),
            },
            {
              name: 'select',
              id: 'product-code',
              next: [
                {
                  name: 'option',
                  text: await translate('ifuSelectProductCode', 'Select Product Code'),
                },
              ],
            },
            {
              name: 'select',
              id: 'product-country',
              next: [
                {
                  name: 'option',
                  text: await translate('ifuSelectCountry', 'Select Country'),
                },
              ],
            },
            {
              name: 'button',
              id: 'product-code-search',
              text: await translate('ifuSearch', 'Search'),
            },
          ],
        },
      ],
    },
  ]));

  function mix(name, title) {
    let element = block.querySelector(`#${name}-code`);
    element.name = `Select ${title}`;
    element.disabled = true;
    element.firstChild.hidden = true;
    element.firstChild.disabled = true;
    element.firstChild.selected = true;

    element = block.querySelector(`#${name}-country`);
    element.name = 'Select Country';
    element.disabled = true;
    element.firstChild.hidden = true;
    element.firstChild.disabled = true;
    element.firstChild.selected = true;

    element = block.querySelector(`#${name}-code-search`);
    element.disabled = true;
  }

  mix('eIFU', 'eIFU');
  mix('udi', 'UDI');
  mix('product', 'Product Code');

  populate(block);
}
