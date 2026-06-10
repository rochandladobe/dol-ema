/* eslint-disable */
/* global WebImporter */

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    const selectorsToRemove = [
      'header',
      'footer',
      'nav',
      '.usa-banner',
      '.usa-header',
      '.usa-footer',
      '.usa-skipnav',
      '.usa-overlay',
      '.site-header',
      '.site-footer',
      '#block-dol-theme-mainnavigation',
      '.dol-header',
      '.dol-footer',
      '[role="banner"]',
      '[role="contentinfo"]',
      'script',
      'style',
      'noscript',
      'iframe',
      '.cookie-banner',
      '#onetrust-consent-sdk',
      '[class*="cookie"]',
    ];
    selectorsToRemove.forEach((selector) => {
      try {
        element.querySelectorAll(selector).forEach((el) => el.remove());
      } catch (e) { /* ignore */ }
    });
  }

  if (hookName === 'afterTransform') {
    element.querySelectorAll('link, meta').forEach((el) => el.remove());
    element.querySelectorAll('[data-drupal-selector], [data-once]').forEach((el) => {
      el.removeAttribute('data-drupal-selector');
      el.removeAttribute('data-once');
    });
  }
}
