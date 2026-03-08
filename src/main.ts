import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import App from './App.vue';
import router from './router';
import './index.css';

// Suppress ResizeObserver loop limit exceeded error
const _ResizeObserver = window.ResizeObserver;
window.ResizeObserver = class ResizeObserver extends _ResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    super((entries, observer) => {
      window.requestAnimationFrame(() => {
        if (!Array.isArray(entries) || !entries.length) {
          return;
        }
        callback(entries, observer);
      });
    });
  }
};

// Global error handler to suppress specific ResizeObserver error
const resizeObserverErrors = [
  'ResizeObserver loop completed with undelivered notifications.',
  'ResizeObserver loop limit exceeded'
];

window.addEventListener('error', (e) => {
  if (resizeObserverErrors.includes(e.message)) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

// Also handle unhandledrejection just in case
window.addEventListener('unhandledrejection', (e) => {
  if (e.reason && resizeObserverErrors.includes(e.reason.message)) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

const app = createApp(App);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(createPinia());
app.use(router);
app.use(ElementPlus);

app.mount('#root');
