import { Sidebar } from './Sidebar';
import { OrganizationSwitcher, UserButton } from '@clerk/clerk-react';

export function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-muted">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-16 px-6 flex items-center justify-between border-b bg-background/80 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <OrganizationSwitcher />
          </div>
          <UserButton afterSignOutUrl="/sign-in" />
        </header>
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
} 