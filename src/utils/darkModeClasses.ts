export const applyDarkMode = (html: string): string => {
  const classMap: Record<string, string> = {
    'bg-white': 'bg-white dark:bg-gray-900',
    'bg-gray-50': 'bg-gray-50 dark:bg-gray-900',
    'bg-gray-100': 'bg-gray-100 dark:bg-gray-800',
    'bg-gray-200': 'bg-gray-200 dark:bg-gray-700',
    'bg-slate-50': 'bg-slate-50 dark:bg-gray-900',
    'bg-slate-100': 'bg-slate-100 dark:bg-gray-800',
    'bg-blue-50': 'bg-blue-50 dark:bg-blue-900/30',
    'text-gray-900': 'text-gray-900 dark:text-gray-100',
    'text-gray-800': 'text-gray-800 dark:text-gray-200',
    'text-gray-700': 'text-gray-700 dark:text-gray-300',
    'text-gray-600': 'text-gray-600 dark:text-gray-400',
    'text-gray-500': 'text-gray-500 dark:text-gray-500',
    'text-slate-800': 'text-slate-800 dark:text-gray-100',
    'text-slate-700': 'text-slate-700 dark:text-gray-200',
    'text-slate-600': 'text-slate-600 dark:text-gray-300',
    'border-gray-200': 'border-gray-200 dark:border-gray-700',
    'border-gray-300': 'border-gray-300 dark:border-gray-600',
  };

  return html;
};
