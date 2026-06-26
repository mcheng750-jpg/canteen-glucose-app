export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "sans-serif"]
      },
      boxShadow: {
        panel: "0 18px 60px rgba(30, 41, 59, 0.18)"
      }
    }
  },
  plugins: []
};
