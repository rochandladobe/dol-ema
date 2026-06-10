export default function decorate(block) {
  const items = [];
  let currentQ = null;
  let currentA = [];

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length >= 2) {
      // Block table format: col1 = question, col2 = answer
      if (currentQ) items.push({ q: currentQ, a: currentA.join('') });
      currentQ = cells[0].innerHTML.trim();
      currentA = [cells[1].innerHTML.trim()];
    } else if (cells.length === 1) {
      // Single cell continuation
      if (currentQ) currentA.push(cells[0].innerHTML.trim());
    }
  });
  if (currentQ) items.push({ q: currentQ, a: currentA.join('') });

  block.innerHTML = items.map((item, i) => `
    <div class="faq-item">
      <button class="faq-question" aria-expanded="false" aria-controls="faq-answer-${i}">
        <span class="faq-question-text">${item.q}</span>
        <span class="faq-icon" aria-hidden="true"></span>
      </button>
      <div class="faq-answer" id="faq-answer-${i}" hidden>
        ${item.a}
      </div>
    </div>
  `).join('');

  block.querySelectorAll('.faq-question').forEach((btn) => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      // Close all others
      block.querySelectorAll('.faq-question[aria-expanded="true"]').forEach((other) => {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          other.nextElementSibling.hidden = true;
        }
      });
      btn.setAttribute('aria-expanded', String(!expanded));
      btn.nextElementSibling.hidden = expanded;
    });
  });
}
