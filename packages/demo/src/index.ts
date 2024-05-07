import { lastModified } from './last-modified.data.js';

const div = document.createElement('div');

div.style.whiteSpace = 'pre';
div.style.fontFamily = 'monospace';
div.textContent = `The demo source was last modified at: ${lastModified}`;

document.body.appendChild(div);
