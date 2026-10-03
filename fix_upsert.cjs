const fs = require('fs');
let content = fs.readFileSync('services/storageService.ts', 'utf8');

const regex = /const \{ error \} = await supabase\.from\('swipes'\)\.insert\(\{\n\s*user_id: user\.id,\n\s*startup_id: startupId,\n\s*direction: direction,\n\s*created_at: new Date\(\)\.toISOString\(\)\n\s*\}\);/;

const replace = `const { error } = await supabase.from('swipes').upsert({
              user_id: user.id,
              startup_id: startupId,
              direction: direction,
              created_at: new Date().toISOString()
          }, { onConflict: 'user_id, startup_id' });`;

const updatedContent = content.replace(regex, replace);
if (content === updatedContent) {
  console.log("Regex didn't match.");
} else {
  fs.writeFileSync('services/storageService.ts', updatedContent, 'utf8');
  console.log("Fixed upsert successfully.");
}
