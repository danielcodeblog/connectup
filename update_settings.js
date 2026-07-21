const fs = require('fs');
let code = fs.readFileSync('components/SettingsView.tsx', 'utf8');

code = code.replace(
  /<div className="flex items-center gap-3">\s*<button\s*onClick=\{onLogout\}\s*className="px-8 py-3 bg-red-50 text-red-600 rounded-2xl text-sm font-black hover:scale-105 active:scale-95 transition-all"\s*>\s*Sign Out\s*<\/button>\s*<\/div>/g,
  ''
);

code = code.replace(
  /<div className="w-full lg:w-72 border-r border-zinc-100 dark:border-zinc-800 bg-zinc-50\/50 dark:bg-zinc-900\/50">\s*<div className="p-8">\s*<h2 className="text-xs font-black uppercase tracking-\[0\.2em\] text-zinc-400 mb-6">Account Settings<\/h2>\s*<SettingsTabs tabs=\{tabs\} activeTab=\{activeTab\} onTabChange=\{setActiveTab\} \/>\s*<\/div>\s*<\/div>/g,
  `<div className="w-full lg:w-72 border-r border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col justify-between">
            <div className="p-8">
              <SettingsTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
            <div className="p-8">
              <button 
                onClick={onLogout}
                className="w-full px-8 py-3 bg-red-50 text-red-600 rounded-2xl text-sm font-black hover:scale-105 active:scale-95 transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>`
);

fs.writeFileSync('components/SettingsView.tsx', code);
