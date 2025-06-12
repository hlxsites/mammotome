const userConfig = {
  buttons: {
    prev: {
      label: 'Back',
      disabled: false,
    },
    next: {
      label: 'Next',
    },
  },
  requiredFields: [
    {
      name: 'FirstName',
      message: 'This field is required.',
    },
    {
      name: 'LastName',
      message: 'This field is required.',
    },
    {
      name: 'Email',
    },
    {
      name: 'Company',
      message: 'This field is required.',
    },
    {
      name: 'PostalCode',
      message: 'This field is required.',
    },
    {
      name: 'Phone',
      message: 'This field is required.',
    },
    {
      name: 'Country',
      message: 'This field is required.',
    },
    {
      name: 'Pardot_Form_Message__c',
      message: 'This field is required.',
    },
    {
      name: 'Unsubscribed',
      message: 'This field is required.',
    },
    {
      name: 'Phone_Opt_In__c',
      message: 'This field is required.',
    },
    {
      name: 'Text_Opt_In__c',
      message: 'This field is required.',
    },
  ],
};

const loadScript = (src, block) => new Promise((resolve, reject) => {
  const marketoScript = document.createElement('script');
  marketoScript.src = src;
  marketoScript.onload = () => resolve();
  marketoScript.onerror = () => reject(new Error(`Failed to load script: ${src}`));
  block.appendChild(marketoScript);
});

const embedMarketoForm = async (block, formId) => {
  await loadScript('//www2.mammotome.com/js/forms2/js/forms2.min.js', block);

  const formElement = document.createElement('form');
  formElement.id = `mktoForm_${formId}`;
  block.appendChild(formElement);

  window.MktoForms2.loadForm('//www2.mammotome.com', '435-TDP-284', formId);

  window.MktoForms2.whenReady((form) => {
    const formEl = form.getFormElem()[0];
    const arrayify = getSelection.call.bind([].slice);

    const fieldRowStor = '.mktoForm > .mktoFormRow';
    const buttonRowStor = '.mktoForm > .mktoButtonRow';
    const buttonStor = '.mktoButtonRow .mktoButton';
    const fsaatPrefix = 'fsaat-';
    const localFragmentAttr = 'data-form-local-fragment';

    const CSSOM_RULEPOS_FIRST = 0;

    const fieldRows = formEl.querySelectorAll(fieldRowStor);
    const submitButtonRow = formEl.querySelector(buttonRowStor);
    const submitButton = submitButtonRow.querySelector(buttonStor);

    userConfig.requiredFields
      .map((fieldDesc) => {
        fieldDesc.label = formEl.querySelector(`[for='${fieldDesc.name}']`);
        fieldDesc.refEl = formEl.querySelector(`[name='${fieldDesc.name}']`);
        return fieldDesc;
      })
      .forEach((fieldDesc) => {
        if (fieldDesc.label && fieldDesc.label.parentNode) {
          fieldDesc.label.parentNode.classList.add('mktoRequiredField');
        }
      });

    const dynableSheet = arrayify(document.styleSheets)
      .filter((sheet) => sheet.ownerNode.nodeName === 'STYLE')[0];

    const fsaatSet = (current, dir) => {
      const FSAAT_DIR_PREV = 'prev';
      const FSAAT_DIR_NEXT = 'next';

      const direction = dir || FSAAT_DIR_NEXT;
      let currentIndex;

      if (current instanceof HTMLElement) {
        currentIndex = +current.id.split(fsaatPrefix)[1];
      } else if (!Number.isNaN(Number(current))) {
        currentIndex = current;
      } else {
        currentIndex = -1;
      }

      const newIndex = direction === FSAAT_DIR_NEXT ? currentIndex + 1 : currentIndex - 1;
      const newHash = `#${fsaatPrefix}${newIndex}`;

      formEl.setAttribute(localFragmentAttr, newHash);
    };

    const isCustomValid = (native, currentStep) => {
      const step = currentStep || formEl;

      form.submittable(false);

      const currentValues = form.getValues();

      const currentUnfilled = userConfig.requiredFields.filter((fieldDesc) => {
        const value = currentValues[fieldDesc.name] || '';
        if (fieldDesc.name === 'Email') {
          const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
          if (fieldDesc.refEl) {
            fieldDesc.refEl.setCustomValidity('');
          }
          if (!value) {
            if (fieldDesc.refEl) {
              fieldDesc.refEl.setCustomValidity('This field is required.');
            }
            return true;
          }
          if (!valid) {
            if (fieldDesc.refEl) {
              fieldDesc.refEl.setCustomValidity('Please enter a valid email address.');
            }
            return true;
          }
        }
        return step.contains(fieldDesc.refEl)
          && (!value || (fieldDesc.refEl.type === 'checkbox' && value === 'no'));
      });

      if (currentUnfilled.length) {
        const field = currentUnfilled[0];
        const message = field.refEl && field.refEl.validationMessage
          ? field.refEl.validationMessage
          : (field.message || 'This field is required.');
        form.showErrorMessage(message, MktoForms2.$(field.refEl));
        return false;
      }

      return true;
    };

    arrayify(fieldRows).forEach((row, rowIdx) => {
      const rowPos = {
        isFirst: rowIdx === 0,
        isLast: rowIdx === fieldRows.length - 1,
      };

      row.id = fsaatPrefix + rowIdx;

      const navButtonRow = rowPos.isLast
        ? submitButtonRow
        : submitButtonRow.cloneNode(true);
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
        newButtonAxis = navButtons.next || submitButton;
        newButtonTmpl = newButtonAxis;
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
          if (e.target.getAttribute('data-dir') === 'next' && !isCustomValid(true, row)) {
            return;
          }
          fsaatSet(row, e.target.getAttribute('data-dir'));
        }
      });

      dynableSheet.insertRule(
        [
          `.mktoForm[${localFragmentAttr}='#${row.id}'] .mktoFormRow#${row.id},`,
          `.mktoForm[${localFragmentAttr}='#${row.id}'] .mktoFormRow#${row.id} + .mktoButtonRow`,
          '{ display: block; }',
        ].join(' '),
        CSSOM_RULEPOS_FIRST,
      );
    });

    form.onValidate(isCustomValid);
    fsaatSet();

    form.onSuccess((values, followUpUrl, submittingForm) => {
      window.location.href = followUpUrl;
      const reducedLocationURL = new URL(document.location.href);
      const keepParams = ['wanted_param_1', 'wanted_param_3'];
      Array.from(reducedLocationURL.searchParams.keys()).forEach((key) => {
        if (!keepParams.includes(key)) {
          reducedLocationURL.searchParams.delete(key);
        }
      });

      const userData = {
        email: values.Email || '',
        phone: values.Phone || '',
        first_name: values.FirstName || '',
        last_name: values.LastName || '',
        address: values.Address || '',
        city: values.City || '',
        region: values.State || '',
        postal_code: values.PostalCode || '',
        country: values.Country || '',
      };

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'enhanced_conversion',
        user_data: userData,
      });

      submittingForm.addHiddenFields({
        LastFormURL: reducedLocationURL.href,
      });
      return false;
    });
  });
};

const getFormId = (block) => {
  const formIdDiv = block.querySelector(':scope > div div:nth-child(2)'); // Select nested div containing the ID
  let formId = '';
  if (formIdDiv) {
    formId = formIdDiv.textContent.trim();
    formIdDiv.textContent = '';
  }
  return formId;
};

const anchorText = (block) => {
  const anchorHeading = block.querySelector(':scope > div > div > h2');
  if (anchorHeading) {
    anchorHeading.classList.add('anchor-text');
  }
};

export default async function decorate(block) {
  anchorText(block);
  const formId = getFormId(block);
  await embedMarketoForm(block, formId);
}
