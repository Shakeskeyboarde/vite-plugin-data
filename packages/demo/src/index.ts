import message, { bar, foo, promise } from './message.data.js';

const div = document.createElement('div');

div.style.whiteSpace = 'pre';
div.style.fontFamily = 'monospace';
div.textContent = JSON.stringify({
  message,
  foo,
  bar,
}, null, 2);

void promise.then((value) => {
  div.textContent = JSON.stringify({
    message,
    foo,
    bar,
    promise: value,
  }, null, 2);
});

document.body.appendChild(div);
