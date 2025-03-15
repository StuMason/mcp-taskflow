'use client';

interface HeaderProps {
  title: string;
  description?: string;
  darkMode?: boolean;
}

export default function Header({ title, description, darkMode = false }: HeaderProps) {
  return (
    <div className={`border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} px-6 py-4`}>
      <div className="flex flex-col gap-1">
        <h1 className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : ''}`}>{title}</h1>
        {description && (
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{description}</p>
        )}
      </div>
    </div>
  );
} 