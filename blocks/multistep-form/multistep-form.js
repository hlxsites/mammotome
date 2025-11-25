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
  // Validate formId first
  if (!formId) {
    // eslint-disable-next-line no-console
    console.error('Marketo form ID is missing. Please check the block structure.');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.innerHTML = '<p style="color: red; padding: 20px; background: #ffebee; border-radius: 8px;">Error: Form ID is missing. Please configure the form ID in the block.</p>';
    block.appendChild(errorDiv);
    return;
  }

  // Show loading state immediately
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'form-loading';
  loadingDiv.innerHTML = '<p>Loading form...</p>';
  block.appendChild(loadingDiv);

  try {
    await loadScript('https://www2.mammotome.com/js/forms2/js/forms2.min.js', block);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load Marketo script:', error);
    if (loadingDiv) {
      loadingDiv.remove();
    }
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.innerHTML = `<p style="color: red; padding: 20px; background: #ffebee; border-radius: 8px;">Error: Failed to load Marketo form script. ${error.message}</p>`;
    block.appendChild(errorDiv);
    return;
  }

  const disableMarketoCSS = () => {
    document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
      if (
        link.href.includes('forms2-theme-simple.css')
        || link.href.includes('forms2.css')
      ) {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      }
    });
  };

  const observer = new MutationObserver(disableMarketoCSS);
  observer.observe(document.head, { childList: true, subtree: true });

  // Remove Marketo CSS immediately and let observer handle any future additions
  disableMarketoCSS();

  // Remove loading state
  if (loadingDiv) {
    loadingDiv.remove();
  }

  // Check if MktoForms2 is available
  if (typeof window.MktoForms2 === 'undefined') {
    // eslint-disable-next-line no-console
    console.error('MktoForms2 is not defined. Marketo script may have failed to load.');
    if (loadingDiv) {
      loadingDiv.remove();
    }
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.innerHTML = '<p style="color: red; padding: 20px; background: #ffebee; border-radius: 8px;">Error: Marketo Forms library is not available.</p>';
    block.appendChild(errorDiv);
    return;
  }

  const formDiv = document.createElement('div');
  formDiv.className = 'form-div';
  const formElement = document.createElement('form');
  formElement.id = `mktoForm_${formId}`;
  formDiv.appendChild(formElement);
  block.appendChild(formDiv);

  // eslint-disable-next-line no-console
  console.log('Loading Marketo form with ID:', formId);
  window.MktoForms2.loadForm('https://www2.mammotome.com', '435-TDP-284', formId);

  window.MktoForms2.whenReady((form) => {
    const url = new URL(document.location.href);
    const pathParts = url.pathname.split('/').filter((part) => part !== '');
    const pageSlug = pathParts[pathParts.length - 1] || document.title || 'homepage';

    const formEl = form.getFormElem()[0];

    form.addHiddenFields({
      productPage: pageSlug,
    });

    form.onSubmit(() => {
      form.addHiddenFields({
        productPage: pageSlug,
      });

      document.querySelectorAll('.fsaat-prev-button').forEach((btn) => {
        btn.style.display = 'none';
        btn.setAttribute('tabindex', '-1');
        btn.setAttribute('aria-hidden', 'true');
      });
    });

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
      // eslint-disable-next-line no-unused-vars
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
          fieldDesc.refEl?.setCustomValidity('');
          if (!value) return fieldDesc.refEl?.setCustomValidity('This field is required.') || true;
          if (!valid) return fieldDesc.refEl?.setCustomValidity('Please enter a valid email address.') || true;
        }
        return step.contains(fieldDesc.refEl) && (!value || (fieldDesc.refEl.type === 'checkbox' && value === 'no'));
      });
      if (currentUnfilled.length) {
        const field = currentUnfilled[0];
        // eslint-disable-next-line no-undef
        form.showErrorMessage(field.refEl?.validationMessage || field.message || 'This field is required.', MktoForms2.$(field.refEl));
        return false;
      }
      form.submittable(true);
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
        navButtons[dir].classList.add(`fsaat-${dir}-button`);
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

    form.onSuccess((values, followUpUrl) => {
      // Enhanced conversions tracking is handled globally in scripts.js
      window.location.href = followUpUrl;
      return false;
    });
  });
};

const getFormId = (block) => {
  // eslint-disable-next-line no-console
  console.log('Block structure:', block);
  // eslint-disable-next-line no-console
  console.log('Block children:', block.children);

  const formIdDiv = block.querySelector(':scope > div div:nth-child(2)');
  // eslint-disable-next-line no-console
  console.log('Found formIdDiv:', formIdDiv);

  let formId = '';
  if (formIdDiv) {
    formId = formIdDiv.textContent.trim();
    // eslint-disable-next-line no-console
    console.log('Extracted formId:', formId);
    formIdDiv.textContent = '';
  } else {
    // eslint-disable-next-line no-console
    console.warn('Form ID div not found. Expected structure: block > div > div:nth-child(2)');
  }
  return formId;
};

export default async function decorate(block) {
  const formId = getFormId(block);
  await embedMarketoForm(block, formId);
}
