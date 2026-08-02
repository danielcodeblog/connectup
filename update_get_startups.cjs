const fs = require('fs');
const content = fs.readFileSync('services/storageService.ts', 'utf8');

const regex = /const \[profileResult, metricsResult\] = await Promise\.all\(\[\s*supabase\.from\('profiles'\)\.select\('id, full_name, title, avatar_url, location'\)\.in\('id', userIds\),\s*supabase\.from\('startup_metrics'\)\.select\('\*'\)\.in\('startup_id', userIds\)\s*\]\);[\s\S]*?return startups;/;

const newCode = `const [profileResult, metricsResult, pitchesResult] = await Promise.all([
             supabase.from('profiles').select('id, full_name, title, avatar_url, location').in('id', userIds),
             supabase.from('startup_metrics').select('*').in('startup_id', userIds),
             supabase.from('pitches').select('*').in('user_id', userIds).eq('is_active', true)
          ]);
          const profileMap = new Map((profileResult.data || []).map((p: any) => [p.id, p]));
          const metricsMap = new Map((metricsResult.data || []).map((m: any) => [m.startup_id, m]));
          const pitchesByUser = new Map<string, any[]>();
          if (pitchesResult.data) {
              pitchesResult.data.forEach((p: any) => {
                  if (!pitchesByUser.has(p.user_id)) pitchesByUser.set(p.user_id, []);
                  pitchesByUser.get(p.user_id)!.push(p);
              });
          }
          const startups: Startup[] = [];
          
          for (const s of startupData) {
              const founder: any = profileMap.get(s.id) || {};
              const metrics: any = metricsMap.get(s.id) || {};
              let valCap = s.valuation_cap;
              if (!valCap && s.tags) {
                  const vcTag = s.tags.find((t: string) => t.startsWith('vc:'));
                  if (vcTag) valCap = parseInt(vcTag.split(':')[1]);
              }
              const baseStartup = {
                  id: s.id,
                  name: s.name,
                  oneLiner: s.one_liner || '',
                  description: s.description || '',
                  industry: s.industry || 'Tech',
                  fundingStage: s.funding_stage || 'Seed',
                  askAmount: s.ask_amount || 0,
                  valuationCap: valCap,
                  videoUrl: normalizeVideoUrl(s.video_url),
                  tags: (s.tags || []).filter((t: string) => !t.startsWith('vc:')), 
                  founder: {
                      name: founder.full_name || 'Founder',
                      role: founder.title || 'CEO',
                      avatarUrl: founder.avatar_url || '',
                      location: founder.location
                  },
                  metrics: { views: metrics.views || 0, likes: metrics.likes || 0 }
              } as Startup;
              
              const userPitches = pitchesByUser.get(s.id);
              if (userPitches && userPitches.length > 0) {
                  // We add pitches in reverse order so Pitch 1 is at the end of the array (top of the deck)
                  // Wait, if swipedeck receives [Pitch 2, Pitch 1], it renders Pitch 1 on top.
                  // startupData is fetched ordered by created_at DESC.
                  // So we should map each startup to its pitches.
                  for (let i = userPitches.length - 1; i >= 0; i--) {
                      const p = userPitches[i];
                      startups.push({
                          ...baseStartup,
                          id: i === 0 ? s.id : \`\${s.id}-pitch\${i}\`,
                          name: p.name || baseStartup.name,
                          oneLiner: p.one_liner || baseStartup.oneLiner,
                          description: p.description || baseStartup.description,
                          videoUrl: normalizeVideoUrl(p.video_url) || baseStartup.videoUrl
                      });
                  }
              } else {
                  startups.push(baseStartup);
              }
          }
          return startups;`;

const updatedContent = content.replace(regex, newCode);
if (updatedContent === content) {
  console.log("No replacement made. Regex mismatch.");
} else {
  fs.writeFileSync('services/storageService.ts', updatedContent, 'utf8');
  console.log("Updated storageService.ts successfully.");
}
