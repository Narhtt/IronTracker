const fs = require('fs');
let content = fs.readFileSync('components/ui/Modal.tsx', 'utf-8');
content = content.replace('onClose();', 'console.trace("Modal onClose called!"); onClose();');
fs.writeFileSync('components/ui/Modal.tsx', content);
