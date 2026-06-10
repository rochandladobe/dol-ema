/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
export default async function decorate(block) {
  const resp = await fetch('/footer.plain.html');

  if (!resp.ok) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('footer-wrapper');
    wrapper.innerHTML = `
      <div>
        <ul>
          <li><a href="/about">About Us</a></li>
          <li><a href="/accessibility-statement">Accessibility Statement</a></li>
          <li><a href="/general-disclaimer">Disclaimers</a></li>
          <li><a href="https://www.disasterassistance.gov/">DisasterAssistance.gov</a></li>
          <li><a href="https://www.dol.gov/general/disasterrecovery">Disaster Recovery Assistance</a></li>
        </ul>
        <ul>
          <li><a href="/foia">Freedom of Information Act</a></li>
          <li><a href="https://www.dol.gov/guidance">Guidance Search</a></li>
          <li><a href="/important-website-notices">Important Website Notices</a></li>
          <li><a href="/research-data/no-fear-act">No Fear Act Data</a></li>
          <li><a href="https://www.oig.dol.gov/">Office of Inspector General</a></li>
        </ul>
        <ul>
          <li><a href="/privacy-and-security-statement">Privacy &amp; Security Statement</a></li>
          <li><a href="https://www.usa.gov/">USA.gov</a></li>
          <li><a href="https://osc.gov/">U.S. Office of Special Counsel</a></li>
          <li><a href="https://www.whitehouse.gov/">White House</a></li>
        </ul>
        <p class="footer-org">
          <strong>U.S. DEPARTMENT OF LABOR</strong>
          200 Constitution Ave NW<br>
          Washington, DC 20210<br>
          <a href="tel:1-866-487-2365">1-866-4-USA-DOL</a><br>
          <a href="tel:1-866-487-2365">1-866-487-2365</a><br>
          <a href="https://www.dol.gov">www.dol.gov</a>
        </p>
      </div>
      <div>
        <ul>
          <li><a href="https://www.dol.gov/general/contact">Contact Us</a></li>
          <li><a href="https://www.dol.gov/general/jobs">Careers at DOL</a></li>
          <li><a href="/about">About Us</a></li>
          <li><a href="/about/agencies">Agencies</a></li>
          <li><a href="https://www.dol.gov/general/faq">FAQ</a></li>
        </ul>
        <p class="footer-social-label">Stay connected</p>
        <ul class="footer-social">
          <li><a href="https://www.facebook.com/departmentoflabor">Facebook</a></li>
          <li><a href="https://twitter.com/USDOL">X</a></li>
          <li><a href="https://www.instagram.com/usdol/">Instagram</a></li>
          <li><a href="https://www.youtube.com/user/USDepartmentofLabor">YouTube</a></li>
          <li><a href="https://www.linkedin.com/company/u-s-department-of-labor">LinkedIn</a></li>
        </ul>
      </div>`;
    block.append(wrapper);
    return;
  }

  const html = await resp.text();
  const footerWrapper = document.createElement('div');
  footerWrapper.classList.add('footer-wrapper');
  footerWrapper.innerHTML = html;
  block.append(footerWrapper);

  decorateExternalLinks(footerWrapper);
}

/* Open off-site links in a new tab and flag them with an icon.
   The last list in the bottom band is the social row — skip it so its
   branded links stay clean. */
function decorateExternalLinks(scope) {
  const bands = scope.querySelectorAll(':scope > div');
  const socialList = bands.length ? bands[bands.length - 1].querySelector(':scope > ul:last-of-type') : null;

  scope.querySelectorAll('a[href^="http"]').forEach((link) => {
    let isExternal = false;
    try {
      isExternal = new URL(link.href).origin !== window.location.origin;
    } catch (e) {
      isExternal = false;
    }
    if (!isExternal) return;

    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');

    if (socialList && socialList.contains(link)) return;
    link.classList.add('footer-external-link');
  });
}
