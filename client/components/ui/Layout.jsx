import { Sidebar } from './Sidebar';
import { OrganizationSwitcher, UserButton } from '@clerk/clerk-react';
import { useState } from 'react';
import { Menu } from 'lucide-react';

export function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-muted relative">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 transition-transform duration-300 md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:block`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Overlay (moved outside sidebar!) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 px-4 sm:px-6 flex items-center justify-between border-b bg-background/80 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>
            <OrganizationSwitcher />
          </div>
          <UserButton afterSignOutUrl="/sign-in" />
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
