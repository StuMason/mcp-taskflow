'use client';

import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  darkMode?: boolean;
}

export default function DashboardLayout({
  children,
  title,
  description,
  darkMode = false,
}: DashboardLayoutProps) {
  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={title} description={description} darkMode={darkMode} />
        <main className={`flex-1 overflow-y-auto p-6 ${darkMode ? 'bg-gray-900 text-gray-100' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
} 