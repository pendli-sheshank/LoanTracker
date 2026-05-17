import { NavLink, Route, Routes } from 'react-router-dom';
import { Dashboard } from './routes/Dashboard';
import { Loans } from './routes/Loans';
import { LoanDetail } from './routes/LoanDetail';
import { LoanNew } from './routes/LoanNew';
import { LoanEdit } from './routes/LoanEdit';
import { Import } from './routes/Import';
import { Analytics } from './routes/Analytics';
import { Tax } from './routes/Tax';
import { Settings } from './routes/Settings';
import {
  IconDashboard,
  IconLoans,
  IconAnalytics,
  IconImport,
  IconTax,
  IconSettings,
} from '@/components/ui/Icons';

const navItems = [
  { to: '/', label: 'Dashboard', end: true, Icon: IconDashboard },
  { to: '/loans', label: 'Loans', Icon: IconLoans },
  { to: '/analytics', label: 'Analytics', Icon: IconAnalytics },
  { to: '/import', label: 'Import', Icon: IconImport },
  { to: '/tax', label: 'Tax', Icon: IconTax },
  { to: '/settings', label: 'Settings', Icon: IconSettings },
];

export function App() {
  return (
    <div className="min-h-dvh flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold leading-none">LoanTracker</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Pro · India</div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ to, label, end, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-sky-500' : ''}`} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer badge */}
        <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-800">
          <div className="text-[11px] text-slate-400 text-center">
            Data stored locally · Private
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75" />
            </svg>
          </div>
          <h1 className="text-base font-bold">LoanTracker</h1>
        </header>

        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-8 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/loans" element={<Loans />} />
            <Route path="/loans/new" element={<LoanNew />} />
            <Route path="/loans/:id" element={<LoanDetail />} />
            <Route path="/loans/:id/edit" element={<LoanEdit />} />
            <Route path="/import" element={<Import />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/tax" element={<Tax />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-10 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex">
        {navItems.map(({ to, label, end, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                isActive ? 'text-sky-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-5 h-5 ${isActive ? 'text-sky-500' : ''}`} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
