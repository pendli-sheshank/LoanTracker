import { NavLink, Route, Routes } from 'react-router-dom';
import { Dashboard } from './routes/Dashboard';
import { Loans } from './routes/Loans';
import { LoanDetail } from './routes/LoanDetail';
import { Import } from './routes/Import';
import { Analytics } from './routes/Analytics';
import { Tax } from './routes/Tax';
import { Settings } from './routes/Settings';

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/loans', label: 'Loans' },
  { to: '/import', label: 'Import' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/tax', label: 'Tax' },
  { to: '/settings', label: 'Settings' },
];

export function App() {
  return (
    <div className="min-h-dvh flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 dark:border-slate-800 px-4 py-3">
        <h1 className="text-lg font-semibold">LoanTracker</h1>
      </header>
      <main className="flex-1 p-4 pb-20">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/loans/:id" element={<LoanDetail />} />
          <Route path="/import" element={<Import />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/tax" element={<Tax />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      <nav className="fixed bottom-0 inset-x-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-around text-xs">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex-1 text-center py-2 ${isActive ? 'text-brand-accent font-semibold' : 'text-slate-500'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
