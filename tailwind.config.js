module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      gridTemplateColumns: {
        '26': 'repeat(26, minmax(0, 1fr))',
        '13': 'repeat(13, minmax(0, 1fr))',
      },
    },
  },
  plugins: [],
}