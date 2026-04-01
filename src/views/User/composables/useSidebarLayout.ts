import { ref } from 'vue';

export function useSidebarLayout() {
  const isSidebarCollapsed = ref(false);
  const isHistoryCollapsed = ref(false);
  const historySidebarWidth = ref(380);
  const isResizing = ref(false);

  const startResizing = (e: MouseEvent) => {
    isResizing.value = true;
    document.addEventListener('mousemove', handleResizing);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleResizing = (e: MouseEvent) => {
    if (!isResizing.value) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 280 && newWidth < 600) {
      historySidebarWidth.value = newWidth;
    }
  };

  const stopResizing = () => {
    isResizing.value = false;
    document.removeEventListener('mousemove', handleResizing);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = '';
  };

  const toggleSidebar = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
  };

  const toggleHistory = () => {
    isHistoryCollapsed.value = !isHistoryCollapsed.value;
  };

  return {
    isSidebarCollapsed,
    isHistoryCollapsed,
    historySidebarWidth,
    isResizing,
    startResizing,
    toggleSidebar,
    toggleHistory
  };
}
