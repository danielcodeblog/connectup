const fs = require('fs');
let content = fs.readFileSync('services/storageService.ts', 'utf8');

// Update submitReport
content = content.replace(
  /submitReport: async \(reportedProfileId: string, reason: string\): Promise<boolean> => \{/,
  `submitReport: async (reportedProfileId: string, reason: string): Promise<boolean> => {\n      reportedProfileId = reportedProfileId.split('-pitch')[0];`
);

fs.writeFileSync('services/storageService.ts', content, 'utf8');
console.log("Updated submitReport successfully.");
