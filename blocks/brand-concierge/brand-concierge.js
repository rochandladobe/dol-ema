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

const ALLOY_SRC = 'https://cdn1.adoberesources.net/alloy/2.30.1-beta.15/alloy.min.js';
const BC_CLIENT_SRC = 'https://experience-stage.adobe.net/solutions/experience-platform-brand-concierge-web-agent/static-assets/main.js';

const DEFAULTS = {
  datastreamId: '625db853-87ee-42fc-a09d-1141472be233',
  orgId: '0F211E64690BA86B0A494136@AdobeOrg',
  edgeDomain: 'edge-int.adobedc.net',
  edgeBasePath: 'ee',
};

const STYLE_CONFIG = {
  text: {
    'welcome.heading': 'Ask us anything',
    'welcome.subheading': 'Get guided answers from Brand Concierge',
    'input.placeholder': 'Type your question...',
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

  // Mount point.
  block.textContent = '';
  const mount = document.createElement('div');
  mount.id = 'brand-concierge-mount';
  mount.style.width = '100%';
  mount.style.minHeight = '600px';
  block.append(mount);

  bootstrapAlloyNamespace();
  window.styleConfiguration = STYLE_CONFIG;

  try {
    // 2) Load the Web SDK.
    await loadScript(ALLOY_SRC);

    // 3) Configure Alloy.
    window.alloy('configure', {
      datastreamId: config.datastreamId,
      orgId: config.orgId,
      defaultConsent: 'in',
      edgeDomain: config.edgeDomain,
      edgeBasePath: config.edgeBasePath,
      debugEnabled: true,
      onBeforeEventSend: (options) => {
        options.xdm = options.xdm || {};
        options.xdm.web = options.xdm.web || {};
        options.xdm.web.webPageDetails = options.xdm.web.webPageDetails || {};
        options.xdm.web.webPageDetails.name = document.title || 'eds-brand-concierge-demo';
        return true;
      },
    });

    // 4) Seed the first event.
    window.alloy('sendEvent', {});

    // 5) Load the Brand Concierge web client.
    await loadScript(BC_CLIENT_SRC);

    // 6) Bootstrap BC against the mount (which is already in the DOM).
    if (!(window.adobe && window.adobe.concierge)) {
      // eslint-disable-next-line no-console
      console.error('[BC] Brand Concierge web client failed to load.');
      return;
    }
    window.adobe.concierge.bootstrap({
      instanceName: 'alloy',
      selector: '#brand-concierge-mount',
      stylingConfigurations: window.styleConfiguration,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[BC] Failed to initialize Brand Concierge:', e);
  }
}
