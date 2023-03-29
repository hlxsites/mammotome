import {
  getMetadata,
  toClassName,
} from '../../scripts/lib-franklin.js';

export async function loadExperimentation() {
  // Define the custom audiences mapping for experimentation
  const EXPERIMENTATION_CONFIG = {
    audiences: {
      device: {
        mobile: () => window.innerWidth < 600,
        desktop: () => window.innerWidth >= 600,
      },
      visitor: {
        new: () => !localStorage.getItem('franklin-visitor-returning'),
        returning: () => !!localStorage.getItem('franklin-visitor-returning'),
      },
    },
  };
  // load experiments
  const experiment = toClassName(getMetadata('experiment'));
  const instantExperiment = getMetadata('instant-experiment');
  if (instantExperiment || experiment) {
    const { runExperiment } = await import('./core.js');
    await runExperiment(experiment, instantExperiment, EXPERIMENTATION_CONFIG);
  }
}

export async function loadExperimentationPreview() {
  // Load experimentation preview overlay
  if (window.location.hostname === 'localhost' || window.location.hostname.endsWith('.hlx.page')) {
    const preview = await import(`${window.hlx.codeBasePath}/tools/preview/preview.js`);
    await preview.default();
    if (window.hlx.experiment) {
      const experimentation = await import(`${window.hlx.codeBasePath}/tools/preview/experimentation.js`);
      experimentation.default();
    }
  }
  // Mark customer as having viewed the page once
  localStorage.setItem('franklin-visitor-returning', true);
}
