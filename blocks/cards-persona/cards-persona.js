export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    const cells = [...row.children];
    const imageCell = cells.find((c) => c.querySelector('picture'));
    const textCell = cells.find((c) => c.querySelector('a'));
    const link = textCell ? textCell.querySelector('a') : null;
    const href = link ? link.getAttribute('href') : null;
    const label = link ? link.textContent.trim() : '';

    // Card is a single link wrapping the image and the label.
    const card = document.createElement('a');
    card.className = 'cards-persona-card';
    if (href) card.href = href;

    if (imageCell) {
      const imageWrap = document.createElement('div');
      imageWrap.className = 'cards-persona-image';
      while (imageCell.firstChild) imageWrap.append(imageCell.firstChild);
      const overlay = document.createElement('span');
      overlay.className = 'cards-persona-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      imageWrap.append(overlay);
      card.append(imageWrap);
    }

    const labelEl = document.createElement('span');
    labelEl.className = 'cards-persona-label';
    labelEl.textContent = label;
    const arrow = document.createElement('span');
    arrow.className = 'cards-persona-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→'; // →
    labelEl.append(arrow);
    card.append(labelEl);

    li.append(card);
    ul.append(li);
  });

  block.textContent = '';
  block.append(ul);
}
