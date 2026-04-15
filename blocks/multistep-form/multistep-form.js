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

const loadScript = (src, container) => new Promise((resolve, reject) => {
  const marketoScript = document.createElement('script');
  marketoScript.src = src;
  marketoScript.onload = () => resolve();
  marketoScript.onerror = () => reject(new Error(`Failed to load script: ${src}`));
  container.appendChild(marketoScript);
});

/**
 * Marketo form + multistep (fsaat) UI. Used by multistep-form block and marker-app contact.
 *
 * @param {HTMLElement} container
 * @param {string|number} formId
 * @param {object} [hooks]
 * @param {boolean} [hooks.clearContainer] replace container children before loading UI (marker-app contact wrapper)
 * @param {function} [hooks.extendHiddenFields] async (form, ctx) => void
 * @param {function} [hooks.onSuccess] (values, followUpUrl, form) => boolean
 * @returns {Promise<object|null>}
 */
export async function embedMultistepMarketoForm(container, formId, hooks = {}) {
  if (!formId) {
    // eslint-disable-next-line no-console
    console.error('Marketo form ID is missing. Please check the block structure.');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.innerHTML = '<p style="color: red; padding: 20px; background: #ffebee; border-radius: 8px;">Error: Form ID is missing. Please configure the form ID in the block.</p>';
    container.appendChild(errorDiv);
    return null;
  }

  container.classList.add('multistep-form', 'multistep-form-embedded');
  if (hooks.clearContainer) {
    container.replaceChildren();
  }

  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'form-loading';
  loadingDiv.innerHTML = '<p>Loading...</p>';
  container.appendChild(loadingDiv);

  if (typeof window.MktoForms2 === 'undefined') {
    const existingScript = document.querySelector('script[src*="forms2.min.js"]');
    try {
      if (existingScript) {
        await new Promise((resolve, reject) => {
          if (window.MktoForms2) {
            resolve();
            return;
          }
          existingScript.addEventListener('load', () => resolve());
          existingScript.addEventListener('error', () => reject(new Error('Marketo script error')));
        });
      } else {
        await loadScript('https://www2.mammotome.com/js/forms2/js/forms2.min.js', container);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load Marketo script:', error);
      loadingDiv.remove();
      const errorDiv = document.createElement('div');
      errorDiv.className = 'form-error';
      errorDiv.innerHTML = `<p style="color: red; padding: 20px; background: #ffebee; border-radius: 8px;">Error: Failed to load Marketo form script. ${error.message}</p>`;
      container.appendChild(errorDiv);
      return null;
    }
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
  disableMarketoCSS();

  if (typeof window.MktoForms2 === 'undefined') {
    // eslint-disable-next-line no-console
    console.error('MktoForms2 is not defined. Marketo script may have failed to load.');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.innerHTML = '<p style="color: red; padding: 20px; background: #ffebee; border-radius: 8px;">Error: Marketo Forms library is not available.</p>';
    container.appendChild(errorDiv);
    return null;
  }

  const formDiv = document.createElement('div');
  formDiv.className = 'form-div';
  const formElement = document.createElement('form');
  formElement.id = `mktoForm_${formId}`;
  formDiv.appendChild(formElement);
  container.appendChild(formDiv);

  // eslint-disable-next-line no-console
  console.log('Loading Marketo form with ID:', formId);
  window.MktoForms2.loadForm('https://www2.mammotome.com', '435-TDP-284', formId);

  const expectedFormDomId = `mktoForm_${formId}`;

  return new Promise((resolve, reject) => {
    window.MktoForms2.whenReady((form) => {
      const domForm = form.getFormElem()[0];
      if (!domForm || domForm.id !== expectedFormDomId) {
        return;
      }

      (async () => {
        try {
          const url = new URL(document.location.href);
          const pathParts = url.pathname.split('/').filter((part) => part !== '');
          const pageSlug = pathParts[pathParts.length - 1] || document.title || 'homepage';

          form.addHiddenFields({
            productPage: pageSlug,
          });

          if (typeof hooks.extendHiddenFields === 'function') {
            await hooks.extendHiddenFields(form, { pageSlug });
          }

          /* Show form as soon as Marketo + hidden fields are ready; fsaat setup below can take many ms */
          loadingDiv.remove();

          const formEl = form.getFormElem()[0];

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
          const submitButton = submitButtonRow?.querySelector(buttonStor);

          if (!submitButtonRow || !submitButton || fieldRows.length === 0) {
            form.onSuccess((values, followUpUrl) => {
              if (typeof hooks.onSuccess === 'function') {
                return hooks.onSuccess(values, followUpUrl, form);
              }
              if (followUpUrl) {
                window.location.href = followUpUrl;
                return false;
              }
              return true;
            });
            resolve(form);
            return;
          }

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

          let dynableSheet = arrayify(document.styleSheets)
            .filter((sheet) => sheet.ownerNode?.nodeName === 'STYLE')[0];
          if (!dynableSheet) {
            const styleEl = document.createElement('style');
            document.head.appendChild(styleEl);
            dynableSheet = styleEl.sheet;
          }

          const fsaatSet = (current, dir) => {
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
            if (typeof hooks.onSuccess === 'function') {
              return hooks.onSuccess(values, followUpUrl, form);
            }
            if (followUpUrl) {
              window.location.href = followUpUrl;
              return false;
            }
            return true;
          });

          resolve(form);
        } catch (err) {
          loadingDiv.remove();
          reject(err);
        }
      })();
    });
  });
}

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
  await embedMultistepMarketoForm(block, formId);
}
