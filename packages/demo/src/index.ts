import 'zod';

import message, { foo, promise } from './message.data.js';

const div = document.createElement('div');

div.style.whiteSpace = 'pre';
div.style.fontFamily = 'monospace';
div.textContent = `${message} - ${foo.text}`;

void promise.then((value) => {
  div.textContent += ' - ' + value;
});

document.body.appendChild(div);
