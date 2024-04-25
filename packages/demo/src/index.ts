import 'zod';

import message from './message.data.js';

const div = document.createElement('div');

div.style.whiteSpace = 'pre';
div.style.fontFamily = 'monospace';
div.textContent = message;

document.body.appendChild(div);
