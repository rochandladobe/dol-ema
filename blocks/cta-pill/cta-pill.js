export default function decorate(block) {
  const heading = block.querySelector('h1, h2, h3');
  const link = block.querySelector('a');

  const wrapper = document.createElement('div');
  wrapper.className = 'cta-pill-inner';
  if (heading) wrapper.append(heading);
  if (link) {
    link.classList.add('cta-pill-button');
    wrapper.append(link);
  }

  block.textContent = '';
  block.append(wrapper);
}
