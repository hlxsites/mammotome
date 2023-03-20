/* eslint-disable no-unused-expressions */
/* global describe before it */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

let lib;

describe('lib-history-section: getNextSiblings', () => {
  before(async () => {
    lib = await import('../../scripts/lib-history-section.js');
    document.body.innerHTML = await readFile({ path: './our-history.html' });
  });

  it('returns all following siblings excluding the search element', async () => {
    const first = document.querySelector('#first');
    expect([...lib.getNextSiblings(first)].length).to.equal(5);
    expect([...lib.getNextSiblings(first)][0]).to.equal(first.nextElementSibling);
    expect([...lib.getNextSiblings(first)][4]).to.equal(document.querySelector('#third'));
  });

  it('returns all following siblings until next H3 excluding the last element', async () => {
    const second = document.querySelector('#second');
    expect([...lib.getNextSiblings(second, 'H3')].length).to.equal(3);
    expect([...lib.getNextSiblings(second, 'H3')][0]).to.equal(second.nextElementSibling);
    expect([...lib.getNextSiblings(second, 'H3')][2]).to.equal(document.querySelector('#third').previousElementSibling);
  });
});
