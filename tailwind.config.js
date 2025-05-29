/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Mengaktifkan mode gelap berbasis kelas pada tag <html>
  theme: {
    extend: {
      colors: {
        // Skema Warna Dark Mode Elegant Baru Sesuai Saran dari doc.txt
        'dark-main-bg': '#1A1F2C',        // Background Utama (Biru Gelap Pekat)
        'dark-container-bg': '#2A3045', // Background Kontainer Game (Biru Abu-abu Sedikit Lebih Terang)
        'brand-gold': '#F1B82D',         // Aksen Utama (Emas)
        'brand-teal': '#00D1B2',         // Aksen Alternatif (Teal Modern) - Opsional, bisa digunakan nanti
        'dark-text-primary': '#FFFFFF',   // Teks Utama (Putih)
        'dark-text-secondary': '#E0E0E0', // Teks Sekunder (Putih Gading)
        'dark-text-placeholder': '#A0AEC0',// Teks Placeholder (Abu-abu Muda Kebiruan)

        // Warna untuk Light Mode (jika diimplementasikan nanti)
        'light-main-bg': '#F8F9FA',      // Background Utama Light Mode (Putih keabuan)
        'light-container-bg': '#FFFFFF', // Background Kontainer Light Mode (Putih)
        'light-text-primary': '#212529',  // Teks Utama Light Mode (Hitam lembut)
        'light-text-secondary': '#6C757D',// Teks Sekunder Light Mode (Abu-abu)

        // Warna Monad lama bisa dihapus jika tidak digunakan lagi
        // 'monad-off-white': '#FFBFAF9',
        // 'monad-purple': '#83EEF9',
        // 'monad-blue': '#200052',
        // 'monad-berry': '#A0055D',
        // 'monad-black': '#0E100F',
      },
      fontFamily: {
        sans: ['Inter', 'Arial', 'sans-serif'], // Tetap menggunakan Inter
      },
      boxShadow: {
        'subtle': '0 2px 4px rgba(0, 0, 0, 0.1)', // Shadow halus untuk elemen seperti header
        'container': '0 4px 12px rgba(0, 0, 0, 0.15)', // Shadow untuk kontainer utama
        'interactive': '0 2px 8px rgba(241, 184, 45, 0.4)', // Shadow lebih jelas untuk tombol emas
        'interactive-hover': '0 4px 12px rgba(241, 184, 45, 0.5)', // Shadow saat hover tombol emas
      },
      animation: {
        flip: 'flipAnimation 0.8s cubic-bezier(0.455, 0.03, 0.515, 0.955)',
        win: 'winAnimation 0.5s ease-out',
        lose: 'loseAnimation 0.5s ease-out',
        fadeIn: 'fadeIn 0.5s ease-in-out',
        slideUp: 'slideUp 0.5s ease-in-out',
        pop: 'pop 0.3s ease-in-out',
        'coin-land': 'coinLand 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Animasi koin mendarat
      },
      keyframes: {
        flipAnimation: {
          '0%': { transform: 'rotateY(0deg) scale(1)' },
          '40%': { transform: 'rotateY(900deg) scale(1.2)' },
          '80%': { transform: 'rotateY(1800deg) scale(1)' },
          '100%': { transform: 'rotateY(1800deg) scale(1)' },
        },
        winAnimation: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.2)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        loseAnimation: {
          '0%': { transform: 'translateX(0) rotate(0deg)' },
          '25%': { transform: 'translateX(-10px) rotate(-5deg)' },
          '50%': { transform: 'translateX(10px) rotate(5deg)' },
          '75%': { transform: 'translateX(-10px) rotate(-5deg)' },
          '100%': { transform: 'translateX(0) rotate(0deg)' },
        },
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        pop: { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.05)' } },
        coinLand: {
          '0%': { transform: 'translateY(-30px) scale(0.9)', opacity: '0' },
          '60%': { transform: 'translateY(5px) scale(1.05)', opacity: '1' },
          '80%': { transform: 'translateY(-2px) scale(0.98)' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};