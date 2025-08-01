// Polyfill for missing Next.js loadable context in Azure
// This provides a minimal implementation to prevent build errors

module.exports = {
  LoadableContext: {
    report: () => {},
    preload: () => {},
  },
};

// Also export as default
module.exports.default = module.exports.LoadableContext;
