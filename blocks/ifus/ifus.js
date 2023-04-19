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
    return element;
  });
}

function populateIFU(json, block) {
  json.eIFUs.data.forEach((eIFU) => {
    const option = document.createElement('option');
    option.text = eIFU.ID;
    block.querySelector('#eIFU-code').append(option);
  });
  const eIFU = block.querySelector('#eIFU-code');
  eIFU.disabled = false;
  json.countries.data.forEach((country) => {
    const option = document.createElement('option');
    option.text = country['Country Name'];
    option.value = country.ISO_3166_1_alpha_2_code;
    block.querySelector('#eIFU-country').append(option);
  });
  const eIFUCountry = block.querySelector('#eIFU-country');
  eIFUCountry.disabled = false;

  const search = block.querySelector('#eIFU-code-search');
  search.disabled = false;
  search.addEventListener('click', async () => {
    const assets = json.IFUAssets.data.filter((asset) => asset.eIFU === eIFU.value
      && asset.Country === eIFUCountry.value);
    block.querySelector('.ifu-result').innerHTML = '';
    block.querySelector('.ifu-result').append(...buildTags([{ name: 'h4', text: await translate('ifuSearchTitle', 'Search results') }]));
    if (assets.length === 0) {
      block.querySelector('.ifu-result').append(...buildTags([{ name: 'div', next: [{ name: 'strong', text: await translate('ifuSearchNoResult', 'No result') }] }]));
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
                            text: json.eIFUToProductCodes.data.filter((match) => match.eIFU_ID === eIFU.value).map((match) => match['Product Code']).join(', '),
                            first:
                              [
                                { name: 'h6', text: await translate('ifuSearchProductCodes', 'Product Code(s)') },
                              ],
                          },
                        ],
                    },
                    {
                      name: 'div',
                      text: eIFUCountry.value,
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
        block.querySelector('.ifu-result').append(...entry);
      }));
    }
    block.querySelector('.ifu-result').classList.remove('no-result');
  });
}

function populateUDI(json, block) {
  const udi = block.querySelector('#udi-code');
  json.UDIs.data.forEach((value) => {
    const option = document.createElement('option');
    option.text = value.Code;
    udi.append(option);
  });
  udi.disabled = false;

  const udiCountry = block.querySelector('#udi-country');
  json.countries.data.forEach((country) => {
    const option = document.createElement('option');
    option.text = country['Country Name'];
    option.value = country.ISO_3166_1_alpha_2_code;
    udiCountry.append(option);
  });
  udiCountry.disabled = false;

  const search = block.querySelector('#udi-code-search');
  search.disabled = false;
  search.addEventListener('click', () => {
    const assets = json.eIFUToUDIs.data.filter((entry) => entry.UDI_DI === udi.value)
      .flatMap((entry) => json.IFUAssets.data.filter((asset) => asset.eIFU === entry.eIFU
        && asset.Country === udiCountry.value));
    if (assets.length === 0) {
      block.querySelector('.ifu-result').innerHTML = '<h4>Search results</h4><div><strong>No result</strong></div>';
    } else {
      block.querySelector('.ifu-result').innerHTML = '<h4>Search results</h4>';
      const map = new Map();
      assets.forEach((asset) => {
        if (map.has(asset.Title)) {
          const links = map.get(asset.Title);
          links.push(asset.URL);
        } else {
          map.set(asset.Title, [asset.URL]);
        }
      });
      map.forEach((value, key) => {
        const entry = document.createElement('div');
        entry.innerHTML = `
        <h5>${key}</h5>
        <div>
            <div>
                <h6>Product Code(s)</h6>
            ${json.UDIToProductCodes.data.filter((match) => match.UDI_DI === udi.value).map((match) => match['Product Code']).join(', ')}
            </div>
            <div>
                <h6>Country Selected</h6>
                ${udiCountry.value}
            </div>
            <div>${value.map((link) => `<a href='${link}' target='blank'><button>${link.substring(link.lastIndexOf('/') + 1)}</button></a>`).join('')}</div>
        </div>`;
        block.querySelector('.ifu-result').append(entry);
      });
    }
    block.querySelector('.ifu-result').classList.remove('no-result');
  });
}

function populateProductCode(json, block) {
  const productCode = block.querySelector('#product-code');
  json.productCodes.data.forEach((value) => {
    const option = document.createElement('option');
    option.text = value.Code;
    productCode.append(option);
  });
  productCode.disabled = false;

  const productCodeCountry = block.querySelector('#product-code-country');
  json.countries.data.forEach((country) => {
    const option = document.createElement('option');
    option.text = country['Country Name'];
    option.value = country.ISO_3166_1_alpha_2_code;
    productCodeCountry.append(option);
  });
  productCodeCountry.disabled = false;

  const search = block.querySelector('#product-code-search');
  search.disabled = false;
  search.addEventListener('click', () => {
    const assets = json.eIFUToProductCodes.data.filter((entry) => entry['Product Code'] === productCode.value)
      .flatMap((entry) => json.IFUAssets.data.filter((asset) => asset.eIFU === entry.eIFU_ID
        && asset.Country === productCodeCountry.value));
    if (assets.length === 0) {
      block.querySelector('.ifu-result').innerHTML = '<h4>Search results</h4><div><strong>No result</strong></div>';
    } else {
      block.querySelector('.ifu-result').innerHTML = '<h4>Search results</h4>';
      const map = new Map();
      assets.forEach((asset) => {
        if (map.has(asset.Title)) {
          const links = map.get(asset.Title);
          links.push(asset.URL);
        } else {
          map.set(asset.Title, [asset.URL]);
        }
      });
      map.forEach((value, key) => {
        const entry = document.createElement('div');
        entry.innerHTML = `
        <h5>${key}</h5>
        <div>
            <div>
                <h6>Product Code(s)</h6>
            ${json.eIFUToProductCodes.data.filter((match) => match['Product Code'] === productCode.value).flatMap((match) => json.eIFUToProductCodes.data.filter((innerMatch) => innerMatch.eIFU_ID === match.eIFU_ID).map((innerMatch) => innerMatch['Product Code'])).join(', ')}
            </div>
            <div>
                <h6>Country Selected</h6>
                ${productCodeCountry.value}
            </div>
            <div>${value.map((link) => `<a href='${link}' target='blank'><button>${link.substring(link.lastIndexOf('/') + 1)}</button></a>`).join('')}</div>
        </div>`;
        block.querySelector('.ifu-result').append(entry);
      });
    }
    block.querySelector('.ifu-result').classList.remove('no-result');
  });
}

async function populate(block) {
  const resp = await fetch('/en/dj-test.json?limit=10000');
  if (resp.ok) {
    const json = await resp.json();
    populateIFU(json, block);
    populateUDI(json, block);
    populateProductCode(json, block);
  } else {
    throw new Error(`${resp.status}: ${resp.statusText}`);
  }
}

export default async function decorate(block) {
  block.innerHTML = `
    <div class="ifu-result no-result">
        <h4>Search results</h4>
    </div>
    <div class="ifu">
        <div class="ifu-selection">
            <h5 class="ifu-title">Search by eIFU</h5>
            <select id="eIFU-code" name="Select eIFU" disabled>
                <option hidden disabled selected value>Select eIFU</option>
            </select>
            <select id="eIFU-country" name="Select Country" disabled>
                <option hidden disabled selected value>Select Country</option>
            </select>
            <button id="eIFU-code-search"disabled>Search</button>
        </div>
        <div class="ifu-selection">
            <h5 class="ifu-title">Search by UDI</h5>
            <select id="udi-code" name="Select UDI" disabled>
                <option hidden disabled selected value>Select UDI</option>
            </select>
            <select id="udi-country" name="Select Country" disabled>
                <option hidden disabled selected value>Select Country</option>
            </select>
            <button id="udi-code-search" disabled>Search</button>
        </div>
        <div class="ifu-selection">
            <h5 class="ifu-title">Search by Product Code</h5>
            <select id="product-code" name="Select Product Code" disabled>
                <option hidden disabled selected value>Select Product Code</option>
            </select>
            <select id="product-code-country" name="Select Country" disabled>
                <option hidden disabled selected value>Select Country</option>
            </select>
            <button id="product-code-search" disabled>Search</button>
        </div>
    </div>`;
  populate(block);
}
