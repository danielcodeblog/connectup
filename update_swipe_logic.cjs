const fs = require('fs');
let content = fs.readFileSync('services/storageService.ts', 'utf8');

// Update processSwipe
content = content.replace(
  /processSwipe: async \(startupId: string, direction: 'left' \| 'right'\) => \{/,
  `processSwipe: async (startupId: string, direction: 'left' | 'right') => {\n      startupId = startupId.split('-pitch')[0];`
);

// Update ensureConnection
content = content.replace(
  /ensureConnection: async \(targetId: string\): Promise<string \| null> => \{/,
  `ensureConnection: async (targetId: string): Promise<string | null> => {\n      targetId = targetId.split('-pitch')[0];`
);

fs.writeFileSync('services/storageService.ts', content, 'utf8');
console.log("Updated swipe logic successfully.");
