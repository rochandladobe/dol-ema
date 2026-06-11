/*
 * Brand Concierge block.
 * Loading order matters:
 *   1. Alloy/Web SDK namespace bootstrap
 *   2. Load Alloy (alloy.min.js)
 *   3. Configure Alloy
 *   4. Load the Brand Concierge web client
 *   5. Bootstrap BC against the mount element (only once the DOM/mount exists)
 *
 * Authoring: a row may override config via cells, e.g.
 *   | Brand Concierge |              |
 *   | datastreamId    | <id>         |
 *   | orgId           | <org>@AdobeOrg |
 */

const ALLOY_SRC = 'https://cdn1.adoberesources.net/alloy/2.34.0/alloy.min.js';
const BC_CLIENT_SRC = 'https://experience.adobe.net/solutions/experience-platform-brand-concierge-web-agent/static-assets/main.js';

const DEFAULTS = {
  datastreamId: '2ade4e33-1104-465d-ae48-671143b71614',
  orgId: '0E061E2D61F93F260A495FD6@AdobeOrg',
  edgeDomain: 'edge.adobedc.net',
  edgeBasePath: 'ee',
  region: 'va7',
  conciergeId: '6a2ac78e507e5a6498ba3933',
  sandboxName: 'us-public-sector-sc',
};

/* The BC web client calls getText() for every one of these keys during
   render; a missing key throws and aborts rendering. Provide them all. */
const STYLE_CONFIG = {
  text: {
    'input.placeholder': 'Type your question...',
    'input.send.aria': 'Send message',
    'input.mic.aria': 'Use microphone',
    'input.messageInput.aria': 'Message input',
    'input.message_input.aria': 'Message input',
    'input.clearHistory.aria': 'Clear chat history',
    'input.clearHistory.label': 'Clear history',
    'carousel.next.aria': 'Next',
    'carousel.prev.aria': 'Previous',
    'scroll.bottom.aria': 'Scroll to latest message',
    'feedback.dialog.cancel': 'Cancel',
    'feedback.dialog.notes': 'Additional notes',
    'feedback.dialog.submit': 'Submit',
    'feedback.toast.success': 'Thank you for your feedback',
  },
};

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === 'true') resolve();
      else existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.addEventListener('load', () => { script.dataset.loaded = 'true'; resolve(); });
    script.addEventListener('error', reject);
    document.head.append(script);
  });
}

/* Alloy namespace bootstrap (queues calls until alloy.min.js loads). */
function bootstrapAlloyNamespace() {
  (function ns(n, o) {
    o.forEach((name) => {
      if (!n[name]) {
        (n.__alloyNS = n.__alloyNS || []).push(name);
        n[name] = (...args) => new Promise((i, l) => { n[name].q.push([i, l, args]); });
        n[name].q = [];
      }
    });
  }(window, ['alloy']));
}

/* Read overrides authored in the block's rows (key | value pairs). */
function readConfig(block) {
  const config = { ...DEFAULTS };
  block.querySelectorAll(':scope > div').forEach((row) => {
    const cells = row.querySelectorAll(':scope > div');
    if (cells.length === 2) {
      const key = cells[0].textContent.trim();
      const value = cells[1].textContent.trim();
      if (key && value) config[key] = value;
    }
  });
  return config;
}

export default async function decorate(block) {
  const config = readConfig(block);

  // Build the floating launcher + chat panel.
  block.textContent = '';

  const launcher = document.createElement('button');
  launcher.type = 'button';
  launcher.className = 'bc-launcher';
  launcher.setAttribute('aria-label', 'Open chat assistant');
  launcher.setAttribute('aria-expanded', 'false');
  launcher.innerHTML = `
    <span class="bc-launcher-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="26" height="26" focusable="false">
        <path fill="currentColor" d="M12 3C6.48 3 2 6.94 2 11.5c0 2.3 1.15 4.37 3 5.86V21l3.3-1.82c1.13.34 2.36.52 3.7.52 5.52 0 10-3.94 10-8.7S17.52 3 12 3Z"/>
      </svg>
    </span>
    <span class="bc-launcher-label">Ask AI</span>`;

  const panel = document.createElement('div');
  panel.className = 'bc-panel';
  panel.setAttribute('hidden', '');
  panel.innerHTML = `
    <div class="bc-panel-header">
      <span class="bc-panel-title">Brand Concierge</span>
      <button type="button" class="bc-panel-close" aria-label="Close chat">&times;</button>
    </div>
    <div id="brand-concierge-mount" class="bc-mount"></div>`;

  block.append(launcher, panel);

  const closeBtn = panel.querySelector('.bc-panel-close');
  let bcStarted = false;

  bootstrapAlloyNamespace();
  window.styleConfiguration = STYLE_CONFIG;

  async function startBC() {
    if (bcStarted) return;
    bcStarted = true;
    try {
      await loadScript(ALLOY_SRC);
      window.alloy('configure', {
        datastreamId: config.datastreamId,
        orgId: config.orgId,
        defaultConsent: 'in',
        edgeDomain: config.edgeDomain,
        edgeBasePath: config.edgeBasePath,
        debugEnabled: true,
        idMigrationEnabled: false,
        thirdPartyCookiesEnabled: false,
        prehidingStyle: '.personalization-container { opacity: 0 !important }',
        conversation: {
          region: config.region,
        },
      });
      window.alloy('sendEvent', {});

      await loadScript(BC_CLIENT_SRC);
      if (!(window.adobe && window.adobe.concierge)) {
        // eslint-disable-next-line no-console
        console.error('[BC] Brand Concierge web client failed to load.');
        return;
      }
      window.adobe.concierge.bootstrap({
        instanceName: 'alloy',
        selector: '#brand-concierge-mount',
        stylingConfigurations: window.styleConfiguration,
        stickySession: false,
      });
    } catch (e) {
      bcStarted = false;
      // eslint-disable-next-line no-console
      console.error('[BC] Failed to initialize Brand Concierge:', e);
    }
  }

  function openPanel() {
    panel.removeAttribute('hidden');
    launcher.setAttribute('aria-expanded', 'true');
    launcher.classList.add('bc-open');
    startBC();
  }

  function closePanel() {
    panel.setAttribute('hidden', '');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.classList.remove('bc-open');
  }

  launcher.addEventListener('click', () => {
    if (panel.hasAttribute('hidden')) openPanel();
    else closePanel();
  });
  closeBtn.addEventListener('click', closePanel);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hasAttribute('hidden')) closePanel();
  });
}
