/**
 * Fallback OpCo fields when the OneTrust JSON or the page block table omits them.
 * Localized notices (e.g. ja-jp) have shipped with literal "??" inside .OpCoName / .VersionNumber;
 * merging defaults fixes rendering until OneTrust content is corrected in the portal.
 */
export const DEFAULT_OPCO_DETAILS = {
  OpCoName: 'Mammotome',
  OpCoEntity: 'Mammotome',
};

/**
 * @param {Record<string, string>} blockConfig from readExactBlockConfig (author overrides)
 * @returns {Record<string, string>}
 */
export function mergeOpCoBlockConfig(blockConfig = {}) {
  const merged = { ...DEFAULT_OPCO_DETAILS };
  Object.entries(blockConfig).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      merged[key] = value;
    }
  });
  return merged;
}

/**
 * Apply block / default OpCo values into the notice DOM after OneTrust has rendered.
 * @param {Record<string, string>} opCoDetails merged config
 */
export function applyOpCoDetailsToNotice(opCoDetails) {
  const pubVerEl = document.getElementsByClassName('otnotice-public-version')[0];
  const versionNumber = pubVerEl ? pubVerEl.innerHTML.trim() : '';
  const versionNum = document.getElementsByClassName('VersionNumber');

  if (opCoDetails.OpCoName) {
    Array.from(document.getElementsByClassName('OpCoName')).forEach((el) => {
      el.innerHTML = opCoDetails.OpCoName;
    });
  }

  if (opCoDetails.OpCoAddressMultiLine) {
    Array.from(document.getElementsByClassName('OpCoAddressMultiLine')).forEach((el) => {
      el.innerHTML = opCoDetails.OpCoAddressMultiLine;
    });
  }

  if (opCoDetails.OpCoEntity) {
    Array.from(document.getElementsByClassName('OpCoEntity')).forEach((el) => {
      el.innerHTML = opCoDetails.OpCoEntity;
    });
  }

  if (opCoDetails.OpCoEmail) {
    Array.from(document.getElementsByClassName('OpCoEmail')).forEach((el) => {
      el.innerHTML = opCoDetails.OpCoEmail;
      el.href = `mailto:${opCoDetails.OpCoEmail}`;
    });
  }

  if (opCoDetails.OpCoCookiePolicy) {
    Array.from(document.getElementsByClassName('OpCoCookiePolicy')).forEach((el) => {
      el.href = opCoDetails.OpCoCookiePolicy;
    });
  }

  if (opCoDetails.OpCoCCPAPolicy) {
    Array.from(document.getElementsByClassName('OpCoCCPAPolicy')).forEach((el) => {
      el.href = opCoDetails.OpCoCCPAPolicy;
    });
  }

  if (opCoDetails.OpCoPrivacyPolicy) {
    Array.from(document.getElementsByClassName('OpCoPrivacyPolicy')).forEach((el) => {
      el.href = opCoDetails.OpCoPrivacyPolicy;
    });
  }

  if (versionNumber) {
    for (let i = 0; i < versionNum.length; i += 1) {
      versionNum[i].innerHTML = versionNumber;
    }
  }

  Array.from(document.getElementsByClassName('otnotice-version')).forEach((el) => {
    el.remove();
  });
}
