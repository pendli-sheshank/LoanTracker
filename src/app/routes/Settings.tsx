import { useEffect, useState } from 'react';
import { db } from '@/db/schema';
import { IconSun, IconMoon, IconShield } from '@/components/ui/Icons';

function getTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function applyTheme(theme: 'light' | 'dark') {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
}

export function Settings() {
  const [theme, setTheme] = useState<'light' | 'dark'>(getTheme);
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  async function handleClearData() {
    if (!window.confirm('Delete ALL loans, payments, and schedules? This cannot be undone.')) return;
    setClearing(true);
    await db.loans.clear();
    await db.payments.clear();
    await db.amortizationRows.clear();
    await db.rateChanges.clear();
    await db.importDocs.clear();
    setClearing(false);
    setCleared(true);
    setTimeout(() => setCleared(false), 3000);
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-sm text-slate-500 mt-0.5">Preferences and data management</p>
      </div>

      {/* Appearance */}
      <SettingSection title="Appearance">
        <div className="flex items-center justify-between py-1">
          <div>
            <div className="text-sm font-medium">Theme</div>
            <div className="text-xs text-slate-500 mt-0.5">Switch between light and dark mode</div>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <ThemeButton
              active={theme === 'light'}
              onClick={() => setTheme('light')}
              icon={<IconSun className="w-4 h-4" />}
              label="Light"
            />
            <ThemeButton
              active={theme === 'dark'}
              onClick={() => setTheme('dark')}
              icon={<IconMoon className="w-4 h-4" />}
              label="Dark"
            />
          </div>
        </div>
      </SettingSection>

      {/* Currency */}
      <SettingSection title="Currency & Locale">
        <div className="flex items-center justify-between py-1">
          <div>
            <div className="text-sm font-medium">Currency</div>
            <div className="text-xs text-slate-500 mt-0.5">Indian Rupee (₹) — INR</div>
          </div>
          <div className="text-sm font-semibold bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-lg">
            ₹ INR
          </div>
        </div>
        <div className="flex items-center justify-between py-1 border-t border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-sm font-medium">Number format</div>
            <div className="text-xs text-slate-500 mt-0.5">Indian lakh/crore system</div>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">e.g. ₹12,34,567</div>
        </div>
      </SettingSection>

      {/* About */}
      <SettingSection title="About">
        <div className="space-y-2">
          {[
            { label: 'Version', value: '1.0.0' },
            { label: 'Storage', value: 'IndexedDB (local)' },
            { label: 'Data location', value: 'This device only' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-1">
              <div className="text-sm text-slate-600 dark:text-slate-400">{label}</div>
              <div className="text-sm font-medium">{value}</div>
            </div>
          ))}

          <div className="mt-3 flex items-start gap-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 p-3">
            <IconShield className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
            <p className="text-xs text-sky-700 dark:text-sky-300 leading-relaxed">
              All your loan data is stored locally on this device using IndexedDB. Nothing is sent to any server — 100% private.
            </p>
          </div>
        </div>
      </SettingSection>

      {/* Danger zone */}
      <SettingSection title="Danger Zone">
        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium text-red-600 dark:text-red-400">Clear all data</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Permanently deletes all loans, payments, and imported schedules. Cannot be undone.
            </div>
          </div>
          {cleared && (
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              All data cleared successfully.
            </div>
          )}
          <button
            onClick={handleClearData}
            disabled={clearing}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
          >
            {clearing ? 'Clearing…' : 'Clear all data'}
          </button>
        </div>
      </SettingSection>
    </div>
  );
}

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="px-5 py-3 space-y-1">{children}</div>
    </div>
  );
}

function ThemeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
        active
          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
