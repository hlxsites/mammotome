import { readBlockConfig } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  const cfg = readBlockConfig(block);
  const width = cfg.width || '50%';
  const line = `<div class="hr-line-container">
    <div class="hr-line" style="width: ${width}"></div>    
</div>`;
  block.innerHTML = '';
  block.innerHTML = line;
}
