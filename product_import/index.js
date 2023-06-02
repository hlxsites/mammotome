import * as fs from 'node:fs/promises';

import { XMLParser } from 'fast-xml-parser';

import pkg from 'exceljs';

const { Workbook } = pkg;

const inprogress = new Set();

async function download(urlString) {
  const url = new URL(urlString);
  const targetDir = `assets/${url.pathname.substring(url.pathname.indexOf('/uploads/') + '/uploads/'.length, url.pathname.lastIndexOf('/'))}`;
  const targetFile = url.pathname.substring(url.pathname.lastIndexOf('/') + 1)
    .replace(/[^a-zA-Z0-9-.]/g, '-')
    .replaceAll('--', '-').toLowerCase();
  const target = `${targetDir}/${targetFile}`;

  await fs.mkdir(targetDir, { recursive: true });

  if (inprogress.has(target)) {
    return `/${target}`;
  }
  inprogress.add(target);

  if (await fs.stat(target).catch(() => false)) {
    return `/${target}`;
  }

  try {
    const resp = await fetch(urlString);
    if (resp.ok) {
      await fs.writeFile(target, Buffer.from(await resp.arrayBuffer()));
    } else {
      throw new Error(`${resp.status} - ${resp.statusText}`);
    }
  } catch (e) {
    console.log(urlString);
    return urlString;
  }
  return `/${target}`;
}

async function parseIfu(media) {
  const data = await fs.readFile('ifu.xml', 'utf8');
  const json = new XMLParser({ ignoreAttributes: false }).parse(data);
  return json.rss.channel.item.map((item) => {
    const { title } = item;
    const status = item['wp:status'];
    const eIfu = item.category?.filter((category) => category['@_domain'] === 'eifu').map((category) => category['#text']);
    const productCodes = item.category?.filter((category) => category['@_domain'] === 'product_code').map((category) => category['#text']);
    const udis = item.category?.filter((category) => category['@_domain'] === 'udi').map((category) => category['#text']);
    const assets = (Array.isArray(item['wp:postmeta']) ? item['wp:postmeta'].filter((meta) => meta['wp:meta_key']?.startsWith('download_assets_')).map((meta) => meta['wp:meta_value']) : []).map((asset) => media.get(asset)).filter((m) => m);
    let countries = (Array.isArray(item['wp:postmeta']) ? item['wp:postmeta'].filter((meta) => meta['wp:meta_key'] === 'countries').map((meta) => meta['wp:meta_value']) : [])
      .flatMap(
        (countriesValue) => countriesValue
          .substring(countriesValue.indexOf('{') + 1, countriesValue.lastIndexOf('}'))
          .split(';')
          .filter((entry) => entry.startsWith('s:'))
          .map((entry) => entry.substring(entry.indexOf('"') + 1, entry.length - 1)),
      );

    if (((countries.length === 0) || (countries[0] === '')) && status === 'publish') {
      let c = title.substring(title.lastIndexOf('-') + 1);
      if (c.lastIndexOf(' ') > 0) {
        c = c.substring(0, c.lastIndexOf(' '));
      }
      switch (c) {
        case 'KOR':
          c = 'KR';
          break;
        case 'FIN':
          c = 'FI';
          break;
        case 'CZE':
          c = 'FI';
          break;
        case 'GRE':
          c = 'GR';
          break;
        case 'HRV':
          c = 'HR';
          break;
        case 'POR':
          c = 'PR';
          break;
        case 'SLO':
          c = 'SI';
          break;
        case 'SLV':
          c = 'SV';
          break;
        default:
      }
      countries = [c];
    }
    return {
      title, status, eIfu, productCodes, udis, assets, countries,
    };
  }).filter((result) => result.status === 'publish' && result.assets.length > 0);
}

async function parseMedia() {
  const data = await fs.readFile('media.xml', 'utf8');
  const json = new XMLParser({ ignoreAttributes: false }).parse(data);
  const result = new Map();
  json.rss.channel.item.forEach((media) => {
    result.set(media['wp:post_id'], media['wp:attachment_url']);
  });
  return result;
}

async function parseProductSupport(media, productDocs) {
  const data = await fs.readFile('productSupport.xml', 'utf8');
  const json = new XMLParser({ ignoreAttributes: false }).parse(data);
  return json.rss.channel.item.map((item) => {
    const { title } = item;
    const status = item['wp:status'];
    const id = item['wp:post_id'];
    const slug = item['wp:post_name'];

    const url = new URL(item.link);
    const language = url.hostname === 'www.mammotome.com' ? 'en' : url.hostname.substring(0, url.hostname.indexOf('.'));
    const images = (Array.isArray(item['wp:postmeta']) ? item['wp:postmeta'].filter((meta) => meta['wp:meta_key'] === '_thumbnail_id').map((meta) => meta['wp:meta_value']) : []).map((asset) => media.get(asset));
    return {
      id,
      slug,
      language,
      title,
      status,
      item,
      images,
      docs: productDocs.filter((doc) => doc.relations.includes(id)),
    };
  }).filter((result) => result.status === 'publish');
}

async function parseProductDocs(media) {
  const data = await fs.readFile('productDocs.xml', 'utf8');
  const json = new XMLParser({ ignoreAttributes: false }).parse(data);
  return json.rss.channel.item.map((item) => {
    const { title } = item;
    const status = item['wp:status'];
    const id = item['wp:post_id'];
    const types = item.category ? [].concat(item.category).filter((category) => category['@_domain'] === 'product_doc_type').map((category) => category['#text']) : [];
    const relations = (Array.isArray(item['wp:postmeta']) ? item['wp:postmeta'].filter((meta) => meta['wp:meta_key']?.startsWith('relation_')).map((meta) => meta['wp:meta_value']) : []);
    let assets = (Array.isArray(item['wp:postmeta'])
      ? item['wp:postmeta']
        .filter((meta) => meta['wp:meta_key'] === 'download_asset').map((meta) => meta['wp:meta_value']) : []).map((asset) => media.get(asset));
    if (assets.length === 0) {
      assets = (Array.isArray(item['wp:postmeta'])
        ? item['wp:postmeta']
          .filter((meta) => meta['wp:meta_key'] === '_links_to').map((meta) => meta['wp:meta_value'])
        : []);
    }
    if ((assets.length === 0 || !assets[0]) && status === 'publish') {
      assets = item.link.endsWith('.pdf') ? [item.link] : [];
    }
    return {
      title, status, assets, types, relations, id, item,
    };
  }).filter((result) => result.status === 'publish');
}

function clean(title) {
  return title
    .replaceAll('<sup style="font-size: 12px; vertical-align: baseline; position: relative; top: -0.50em;">&reg;', '®')
    .replaceAll('<sup>&trade;</sup>', '™')
    .replaceAll('<sup>&reg;</sup>', '®')
    .replaceAll('<sup class="h1_sup">&reg;</sup>', '®')
    .replaceAll('<sup class="h1_sup">&trade;</sup>', '™')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('<sup>', '')
    .replaceAll('</sup>', '');
}

const media = await parseMedia();

const ifus = await parseIfu(media);

const productDocs = await parseProductDocs(media);

const productSupport = await parseProductSupport(media, productDocs);

const result = {
  ifus: [['eIFU', 'Title', 'Countries', 'URL', 'ProductCodes']],
  assets: [['Page', 'Language', 'Name', 'URL']],
  products: [['Page', 'Countries', 'Name', 'Image']],
  translations: [['Page', 'Language', 'Name', 'Image']],
};

let productRowCount = 2;
const rowMap = new Map();

const slugs = new Map();

productSupport.forEach((support) => {
  if (!slugs.has(support.slug)) {
    slugs.set(support.slug, []);
  }
  slugs.set(support.slug, slugs.get(support.slug).concat(support));
});

Array.from(slugs.entries()).forEach(([key, values]) => {
  let translations = [];
  let value;
  if (values.length === 1) {
    [value] = values;
  } else if (values.length > 1) {
    value = values.find((v) => v.language === 'en');
    if (value) {
      translations = values.filter((v) => v.language !== 'en');
    } else {
      [value] = values;
      translations = values.splice(1);
    }
  }
  const title = clean(value?.title || '');
  const [image] = value.images;

  const countries = values
    .map((v) => {
      switch (v.language) {
        case 'en':
          return 'US';
        case 'en-gb':
          return 'GB';
        case 'es':
          return 'ES';
        case 'fr':
          return 'FR';
        case 'de':
          return 'DE';
        case 'it':
          return 'IT';
        case 'pl':
          return 'PL';
        default:
          return v.language;
      }
    }).join('|');

  result.products.push([
    key,
    countries,
    title,
    image,
  ]);

  rowMap.set(key, productRowCount);
  productRowCount += 1;

  translations.forEach((support) => {
    result.translations.push([
      { formula: `='helix-Product'!A${rowMap.get(key)}` },
      support.language,
      clean(support.title),
      support.images[0],
    ]);
  });
});

const ifuMap = new Map();

ifus.forEach((ifu) => {
  ifu.assets.forEach((asset) => {
    const key = `${String(ifu.eIfu).padStart(6, '0')}, ${clean(ifu.title)}, ${asset}, ${ifu.productCodes.join('|')}`;
    let resultIFU;
    if (ifuMap.has(key)) {
      resultIFU = ifuMap.get(key);
    } else {
      resultIFU = { ifu, countries: new Set(), asset };
    }
    ifu.countries.forEach((country) => resultIFU.countries.add(country));
    ifuMap.set(key, resultIFU);
  });
});

await Promise.all(Array.from(ifuMap.values()).map(async ({ ifu, countries, asset }) => {
  const target = await download(asset);
  result.ifus.push([
    String(ifu.eIfu).padStart(6, '0'),
    clean(ifu.title),
    Array.from(countries).join('|'),
    target,
    ifu.productCodes.join('|'),
  ]);
}));

await Promise.all(
  Array
    .from(slugs.entries())
    .map(async ([key, value]) => Promise.all(
      value.map(async (support) => Promise.all(
        support.docs.map(async (docs) => Promise.all(
          docs.assets.map(async (asset) => {
            const target = await download(asset);
            result.assets.push([{ formula: `='helix-Product'!A${rowMap.get(key)}` },
              support.language,
              clean(docs.title),
              target,
            ]);
          }),
        )),
      )),
    )),
);

const workbook = new Workbook();
let worksheet = workbook.addWorksheet('helix-Product');
worksheet.addRows(result.products);

worksheet = workbook.addWorksheet('helix-ProductTranslation');
worksheet.addRows(result.translations);

worksheet = workbook.addWorksheet('helix-ProductAsset');
worksheet.addRows(result.assets);

worksheet = workbook.addWorksheet('helix-eIFU');
worksheet.addRows(result.ifus);

await workbook.xlsx.writeFile('productDB.xlsx');
