import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './assets/dark-theme.css';
import { initTheme } from './utils/theme.js';

initTheme();

const app = createApp(App);
app.use(router);
app.mount('#app');