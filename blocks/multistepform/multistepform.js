const loadScript = (src, block) => new Promise((resolve, reject) => {
  const marketoScript = document.createElement('script');
  marketoScript.src = src;
  marketoScript.onload = () => resolve();
  marketoScript.onerror = () => reject(new Error(`Failed to load script: ${src}`));
  block.appendChild(marketoScript);
});

const embedFSAAT = async (block, formId) => {
  await loadScript('//www2.mammotome.com/js/forms2/js/forms2.min.js', block);

  const formElement = document.createElement('form');
  formElement.id = `mktoForm_${formId}`;
  block.appendChild(formElement);

  window.MktoForms2.loadForm('//www2.mammotome.com', '435-TDP-284', formId);

  window.MktoForms2.whenReady((form) => {
    const userConfig = {
      requiredFields: [],
      buttons: {
        prev: { label: 'Back', disabled: false },
        next: { label: 'Next' },
      },
    };

    const formEl = form.getFormElem()[0];

    const isCustomValid = (_native, currentStep) => {
      form.submittable(false);

      const stepRoot = currentStep || formEl;
      const currentValues = form.getValues();

      const currentUnfilled = userConfig.requiredFields
        .filter((fieldDesc) => stepRoot.contains(fieldDesc.refEl)
          && (!currentValues[fieldDesc.name]
            || (fieldDesc.refEl.type === 'checkbox' && currentValues[fieldDesc.name] === 'no')));

      if (currentUnfilled.length) {
        form.showErrorMessage(currentUnfilled[0].message, MktoForms2.$(currentUnfilled[0].refEl));
        return false;
      }

      form.submittable(true);
      return true;
    };

    const fsaatSet = (current, direction = 'next') => {
      let currentIndex;

      if (current instanceof HTMLElement) {
        currentIndex = +current.id.split('fsaat-')[1];
      } else if (!Number.isNaN(Number(current))) {
        currentIndex = current;
      } else {
        currentIndex = -1;
      }

      const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      const newHash = `#fsaat-${newIndex}`;

      formEl.setAttribute('data-form-local-fragment', newHash);
    };

    formEl.querySelectorAll('.mktoFormRow').forEach((row) => {
      const input = row.querySelector('input, select, textarea, button');
      if (!input) return;

      const isRequired = input.required
        || input.getAttribute('aria-required') === 'true'
        || row.classList.contains('mktoRequired');

      if (!isRequired) return;

      const { name } = input;
      const isRadio = input.type === 'radio';

      const refEl = isRadio
        ? formEl.querySelectorAll(`input[type="radio"][name="${name}"]`)
        : input;

      // Primary: label with aria-labelledby ID (commonly used on radio groups)
      let label = null;

      if (input.hasAttribute('aria-labelledby')) {
        const labelId = input.getAttribute('aria-labelledby')?.split(' ')[0];
        if (labelId) label = document.getElementById(labelId);
      }

      // Fallback: look for any label within the row
      if (!label) {
        label = row.querySelector('label');
      }

      // As a last resort, use row text (or name)
      const labelText = label?.textContent?.trim() || name;

      userConfig.requiredFields.push({
        name,
        message: `${labelText} is required.`,
        label,
        refEl,
      });

      if (label?.parentNode) {
        label.parentNode.classList.add('mktoRequiredField');
      } else {
        row.classList.add('mktoRequiredField');
      }
    });

    const arrayify = Function.prototype.call.bind(Array.prototype.slice);

    const fieldRowStor = '.mktoForm > .mktoFormRow';
    const buttonRowStor = '.mktoForm > .mktoButtonRow';
    const buttonStor = '.mktoButtonRow .mktoButton';
    const fsaatPrefix = 'fsaat-';
    const localFragmentAttr = 'data-form-local-fragment';
    const CSSOM_RULEPOS_FIRST = 0;

    const fieldRows = formEl.querySelectorAll(fieldRowStor);
    const submitButtonRow = formEl.querySelector(buttonRowStor);
    const submitButton = submitButtonRow?.querySelector(buttonStor);

    // if (!fieldRows.length || !submitButtonRow || !submitButton) {
    //   console.warn('Missing form rows or submit button row. Aborting multistep setup.');
    //   return;
    // }

    userConfig.requiredFields.forEach((fieldDesc) => {
      if (!fieldDesc.name) {
        console.warn('Missing field name in requiredFields:', fieldDesc);
        return;
      }

      const label = formEl.querySelector(`[for='${fieldDesc.name}']`);
      const refEl = formEl.querySelector(`[name='${fieldDesc.name}']`);

      fieldDesc.label = label;
      fieldDesc.refEl = refEl;

      if (!label) {
        console.warn(`Label not found for required field: ${fieldDesc.name}`);
        return;
      }

      if (!label.parentNode) {
        console.warn(`Label for ${fieldDesc.name} has no parentNode.`);
        return;
      }

      label.parentNode.classList.add('mktoRequiredField');
    });

    const dynableSheet = arrayify(document.styleSheets)
      .find((sheet) => sheet.ownerNode?.nodeName === 'STYLE');

    if (!dynableSheet) {
      console.warn('No dynamic <style> tag found; skipping insertRule.');
      return;
    }

    arrayify(fieldRows).forEach((row, rowIdx) => {
      const rowPos = {
        isFirst: rowIdx === 0,
        isLast: rowIdx === fieldRows.length - 1,
      };

      row.id = fsaatPrefix + rowIdx;

      const navButtonRow = rowPos.isLast ? submitButtonRow : submitButtonRow.cloneNode(true);
      const newRowAxis = row.nextSibling;
      const nextEnabled = !rowPos.isLast;
      const prevEnabled = !rowPos.isFirst && !userConfig.buttons.prev.disabled;
      let newButtonAxis;
      let newButtonTmpl;
      const navButtons = {};

      if (nextEnabled) {
        navButtons.next = navButtonRow.querySelector(buttonStor);
      }

      if (prevEnabled) {
        const fallbackButton = navButtons.next || submitButton;
        newButtonAxis = fallbackButton;
        newButtonTmpl = fallbackButton;
        navButtons.prev = newButtonTmpl.cloneNode();
      }

      Object.keys(navButtons).forEach((dir) => {
        navButtons[dir].type = 'button';
        navButtons[dir].setAttribute('data-dir', dir);
        navButtons[dir].innerHTML = userConfig.buttons[dir].label;
      });

      if (nextEnabled) {
        row.parentNode.insertBefore(navButtonRow, newRowAxis);
      }

      if (prevEnabled) {
        newButtonAxis.parentNode.insertBefore(navButtons.prev, newButtonAxis);
      }

      navButtonRow.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' && e.target.type === 'button') {
          const dir = e.target.getAttribute('data-dir');
          if (dir === 'next' && !isCustomValid(true, row)) return;

          const isFinalStep = row.id === `${fsaatPrefix}${fieldRows.length - 1}`;
          if (isFinalStep && dir === 'next') {
            form.submit();
            return;
          }

          fsaatSet(row, dir);
        }
      });

      dynableSheet.insertRule([
        `.mktoForm[${localFragmentAttr}='#${row.id}'] .mktoFormRow#${row.id},`,
        `.mktoForm[${localFragmentAttr}='#${row.id}'] .mktoFormRow#${row.id} + .mktoButtonRow`,
        '{ display: block; }',
      ].join(' '), CSSOM_RULEPOS_FIRST);
    });

    form.onValidate(isCustomValid);
    form.onSuccess((followUpUrl) => {
      const formElem = form.getFormElem();
      if (formElem && formElem[0]) {
        formElem.hide();
        window.location.href = followUpUrl;
        console.log('Marketo form submitted. Redirecting to:', followUpUrl);
      } else {
        console.error('Form element is null or undefined.');
      }
      return false;
    });
    fsaatSet();
  });
};

export default async function decorate(block) {
  const formId = block.textContent.trim();
  block.textContent = '';
  await embedFSAAT(block, formId);
}
