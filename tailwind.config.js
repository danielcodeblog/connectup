module.exports = {
  theme: {
    extend: {
      colors: {
        // Force hex colors to avoid oklab/oklch
        // This is a workaround for framer-motion animation issues
      },
    },
  },
};
