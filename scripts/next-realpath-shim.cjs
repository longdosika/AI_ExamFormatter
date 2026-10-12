// Windows worktree compatibility: Next's dependency check uses async realpath,
// which can return EPERM for valid node_modules paths while sync realpath works.
const fs = require('node:fs');
const originalRealpath = fs.promises.realpath.bind(fs.promises);
fs.promises.realpath = async function realpathWithWindowsFallback(target, options) {
  try {
    return await originalRealpath(target, options);
  } catch (error) {
    if (error && error.code === 'EPERM') {
      return fs.realpathSync(target, options);
    }
    throw error;
  }
};
