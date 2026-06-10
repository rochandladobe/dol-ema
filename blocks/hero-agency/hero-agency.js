export default function decorate(block) {
  const picture = block.querySelector('picture');
  const link = block.querySelector('a');
  const href = link ? link.getAttribute('href') : null;
  const label = link ? link.textContent.trim() : '';

  if (!picture) {
    block.classList.add('no-image');
    return;
  }

  // Render as a single full-width linked banner image (the heading, yellow
  // box, and arrow are baked into the source PNG).
  const banner = document.createElement('a');
  banner.className = 'hero-agency-banner';
  if (href) banner.href = href;
  if (label) banner.setAttribute('aria-label', label);
  banner.append(picture);

  block.textContent = '';
  block.append(banner);
}
