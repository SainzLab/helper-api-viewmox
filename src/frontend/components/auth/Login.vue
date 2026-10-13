<template>
  <div class="min-h-screen bg-moxdark flex items-center justify-center p-6 relative overflow-hidden">
    
    <!-- Efek Latar Belakang Ambien (Opsional untuk estetika) -->
    <div class="absolute top-[-10%] left-[-10%] w-96 h-96 bg-moxgreen/20 blur-[120px] rounded-full pointer-events-none"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>

    <!-- Login Container -->
    <div class="flex max-w-5xl w-full h-[550px] bg-moxcard rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden border border-slate-700/50 relative z-10">
      
      <!-- Panel Form Kiri -->
      <div class="w-full md:w-[450px] p-10 flex flex-col justify-center bg-moxcard relative z-20">

        <form @submit.prevent="handleLogin" class="space-y-5">
          <!-- Username -->
          <div>
            <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Username</label>
            <div class="relative">
              <i class="ph ph-user absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg"></i>
              <input 
                type="text" 
                v-model="form.username"
                placeholder="Masukkan username admin"
                class="w-full bg-slate-900/50 border border-slate-700 text-white text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-moxgreen transition shadow-inner"
                required
              >
            </div>
          </div>

          <!-- Password -->
          <div>
            <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <div class="relative">
              <i class="ph ph-lock-key absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg"></i>
              <input 
                type="password" 
                v-model="form.password"
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                class="w-full bg-slate-900/50 border border-slate-700 text-white text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-moxgreen transition shadow-inner"
                required
              >
            </div>
          </div>

          <!-- Captcha Display & Input -->
          <div class="pt-2">
            <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Verifikasi Keamanan</label>
            <div class="flex items-center gap-3 mb-3">
              <!-- Canvas Container -->
              <div class="bg-slate-50 p-1 rounded-lg border border-slate-700 w-[140px] h-[45px] overflow-hidden shadow-inner">
                <canvas ref="captchaCanvas" width="130" height="35" class="w-full h-full cursor-crosshair"></canvas>
              </div>
              <button type="button" @click="generateCaptcha" class="w-10 h-10 flex items-center justify-center bg-slate-800 border border-slate-700 text-slate-400 hover:text-moxgreen hover:border-moxgreen/50 rounded-lg transition" title="Refresh CAPTCHA">
                <i class="ph-bold ph-arrows-clockwise text-lg"></i>
              </button>
            </div>
            
            <input 
              type="text" 
              v-model="form.captchaInput"
              placeholder="Ketik kode di atas"
              class="w-full bg-slate-900/50 border border-slate-700 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-moxgreen transition shadow-inner uppercase font-mono"
              required
            >
            <p v-if="captchaError" class="text-rose-500 text-xs mt-2 font-medium flex items-center gap-1.5">
              <i class="ph-fill ph-warning-circle"></i> Kode CAPTCHA tidak cocok, coba lagi.
            </p>
          </div>

          <!-- Login Button -->
          <div class="pt-4">
            <button 
              type="submit" 
              class="w-full bg-moxgreen text-moxdark hover:bg-emerald-400 font-bold py-3 rounded-lg transition shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] flex justify-center items-center gap-2"
            >
              <i class="ph-bold ph-sign-in text-lg"></i> Masuk Sistem
            </button>
          </div>
        </form>

        <div class="mt-auto pt-8 text-xs text-slate-500 font-medium">
          &copy; {{ new Date().getFullYear() }} Diskominfo Kabupaten Subang.
        </div>
      </div>

      <!-- Panel Akses Kanan (Hero Graphic) -->
      <div class="hidden md:flex flex-1 bg-slate-900 relative items-center justify-center overflow-hidden border-l border-slate-800">
        <!-- Grid Pattern Overlay -->
        <div class="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        
        <!-- Glowing Center -->
        <div class="absolute w-96 h-96 bg-moxgreen/10 blur-[100px] rounded-full"></div>
        
        <!-- Icon Graphic -->
        <i class="ph-duotone ph-shield-check text-[18rem] text-slate-800/80 absolute -right-16 -bottom-16 rotate-12"></i>
        
        <div class="text-center z-10 px-12 relative">
          <h2 class="text-3xl font-bold text-white mb-4">Infrastructure Control</h2>
          <p class="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
            Sistem pemantauan terpusat untuk Proxmox VE Diskominfo.
            Hanya untuk personel dengan otorisasi Administrator.
          </p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router'; // 1. Import useRouter

const router = useRouter(); // 2. Inisialisasi router

const form = ref({
  username: '',
  password: '',
  captchaInput: ''
});

const captchaCanvas = ref(null);
const actualCaptchaText = ref('');
const captchaError = ref(false);

const generateCaptcha = () => {
  if (!captchaCanvas.value) return;
  const ctx = captchaCanvas.value.getContext('2d');
  const width = captchaCanvas.value.width;
  const height = captchaCanvas.value.height;

  // Latar belakang canvas sedikit off-white agar nyaman di mata
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  actualCaptchaText.value = code;

  // Tipografi Captcha disesuaikan dengan tema
  ctx.font = 'bold 24px "Courier New", Courier, monospace';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < code.length; i++) {
    const xOffset = 15 + (i * 18);
    const yOffset = height / 2 + (Math.random() * 6 - 3);
    const angle = (Math.random() * 0.4) - 0.2;

    ctx.save();
    ctx.translate(xOffset, yOffset);
    ctx.rotate(angle);
    // Warna teks gelap Slate-800
    ctx.fillStyle = '#1e293b';
    ctx.fillText(code[i], 0, 0);
    ctx.restore();
  }

  // Garis noise menggunakan warna hijau Moxgreen
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(Math.random() * width, Math.random() * height);
    ctx.lineTo(Math.random() * width, Math.random() * height);
    ctx.stroke();
  }
};

const handleLogin = async () => {
  // Validasi Captcha
  if (form.value.captchaInput.toLowerCase() !== actualCaptchaText.value.toLowerCase()) {
    captchaError.value = true;
    form.value.captchaInput = '';
    generateCaptcha(); 
    return;
  }

  captchaError.value = false;
  
  try {
    // Tembak API Backend
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.value.username,
        password: form.value.password
      })
    });

    const data = await response.json();

    if (data.success) {
      // 3. Simpan sesi di localStorage
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userData', JSON.stringify(data.user)); 
      
      // 4. Redirect ke dashboard menggunakan Vue Router
      router.push('/dashboard'); 
    } else {
      // Menampilkan pesan error (Misal: Password salah / Bukan Admin)
      alert(data.message);
      form.value.password = '';
      form.value.captchaInput = '';
      generateCaptcha();
    }
  } catch (err) {
    console.error(err);
    alert('Gagal terhubung ke server database.');
  }
};

onMounted(() => {
  generateCaptcha();
});
</script>