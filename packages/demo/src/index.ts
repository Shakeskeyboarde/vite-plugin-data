import buildTime from './build-time.js';

const div = document.createElement('div');

div.style.whiteSpace = 'pre';
div.style.fontFamily = 'monospace';
div.textContent = buildTime;

document.body.appendChild(div);
