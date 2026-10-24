import { ref } from 'vue';

export const globalToast = ref({
  show: false,
  type: 'success',
  title: '',
  message: ''
});

let toastTimer = null;

export const showGlobalToast = (type, title, message, duration = 5000) => {
  if (toastTimer) clearTimeout(toastTimer);
  globalToast.value = {
    show: true,
    type,
    title,
    message
  };
  toastTimer = setTimeout(() => {
    globalToast.value.show = false;
  }, duration);
};

export const hideGlobalToast = () => {
  if (toastTimer) clearTimeout(toastTimer);
  globalToast.value.show = false;
};
