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

  setTimeout(disableMarketoCSS, 500);

  const formDiv = document.createElement('div');
  formDiv.className = 'form-div';
  const formElement = document.createElement('form');
  formElement.id = `mktoForm_${formId}`;
  formDiv.appendChild(formElement);
  block.appendChild(formDiv);

  window.MktoForms2.loadForm('//www2.mammotome.com', '435-TDP-284', formId);

  window.MktoForms2.whenReady((form) => {
    form.onSubmit(() => {
      document.querySelectorAll('.fsaat-prev-button').forEach((btn) => {
        btn.style.display = 'none';
        btn.setAttribute('tabindex', '-1');
        btn.setAttribute('aria-hidden', 'true');
      });
    });

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
          fieldDesc.refEl?.setCustomValidity('');
          if (!value) return fieldDesc.refEl?.setCustomValidity('This field is required.') || true;
          if (!valid) return fieldDesc.refEl?.setCustomValidity('Please enter a valid email address.') || true;
        }
        return step.contains(fieldDesc.refEl) && (!value || (fieldDesc.refEl.type === 'checkbox' && value === 'no'));
      });
      if (currentUnfilled.length) {
        const field = currentUnfilled[0];
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

    form.onSuccess((values, followUpUrl, submittingForm) => {
      window.location.href = followUpUrl;
      const url = new URL(document.location.href);
      const pathParts = url.pathname.split('/');
      const productPage = pathParts[4] || '';

      // ADD FIELD IN MARKETO
      submittingForm.addHiddenFields({
        Product_Page: productPage,
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

      return false;
    });
  });
};

const getFormId = (block) => {
  const formIdDiv = block.querySelector(':scope > div div:nth-child(2)');
  let formId = '';
  if (formIdDiv) {
    formId = formIdDiv.textContent.trim();
    formIdDiv.textContent = '';
  }
  return formId;
};

export default async function decorate(block) {
  const formId = getFormId(block);
  await embedMarketoForm(block, formId);
}
