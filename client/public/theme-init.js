// Runs before styles load to avoid flashing the wrong appearance.
try {
  const saved = localStorage.getItem('school-theme');
  document.documentElement.dataset.theme = saved === 'light' || saved === 'dark' ? saved : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
} catch { document.documentElement.dataset.theme = 'light'; }
