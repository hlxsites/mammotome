# Mammotome Product DB import
Generates a productDB.xlsx and an assets folder with the product information and the downloadable media for products from wordpress exports.

## Installation

```sh
npm i
```

## Run

Export from the wordpress `Tools/export`the following: 
* `Ifus` into `ifus.xml`, 
* `Product Support` into `productSupport.xml`, 
* `Product Docs` into `productDocs.xml`, and 
* `Media` into `media.xml` 

(all xml files should go into the same dir as this Readme). 

Then run:

```sh
node index.js
```

which shoudl generate an `assets` folder (with the downloaded assets) and a `productDB.xlsl` with the product db.
