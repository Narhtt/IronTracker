console.log('start');
queueMicrotask(() => console.log('microtask'));
setTimeout(() => console.log('timeout'), 0);
console.log('end');
