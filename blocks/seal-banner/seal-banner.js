export default function decorate(block) {
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    if (cell.querySelector('picture')) cell.classList.add('seal-banner-image');
  });
}
