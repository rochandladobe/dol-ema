export default function decorate(block) {
  const picture = block.querySelector('picture');
  const link = block.querySelector('a');
  const href = link ? link.getAttribute('href') : null;
  const label = link ? link.textContent.trim() : '';

  if (!picture) {
    block.classList.add('no-image');
    return;
  }

  // Full-width linked banner: cropped image with the title overlaid in a
  // yellow box at the top-left.
  const banner = document.createElement('a');
  banner.className = 'hero-agency-banner';
  if (href) banner.href = href;

  const imageWrap = document.createElement('div');
  imageWrap.className = 'hero-agency-image';
  imageWrap.append(picture);

  const textWrap = document.createElement('div');
  textWrap.className = 'hero-agency-text-wrapper';
  const heading = document.createElement('span');
  heading.className = 'hero-agency-text';
  heading.textContent = label;
  const arrow = document.createElement('span');
  arrow.className = 'hero-agency-arrow';
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '→'; // →
  heading.append(arrow);
  textWrap.append(heading);

  banner.append(imageWrap, textWrap);
  block.textContent = '';
  block.append(banner);
}
