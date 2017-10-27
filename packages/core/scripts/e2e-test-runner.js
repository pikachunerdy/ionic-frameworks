const glob = require('glob');
const Mocha = require('mocha');
const path = require('path');

const mocha = new Mocha();

function startDevServer() {
  const server = require('@stencil/dev-server/dist'); // TODO: fix after stencil-dev-server PR #16 is merged
  const cmdArgs = ['--config', path.join(__dirname, '../stencil.config.js'), '--no-open'];

  return server.run(cmdArgs);
}

function getTestFiles() {
  return new Promise((resolve, reject) => {
    const src = path.join(__dirname, '../src/**/*.e2e-spec.js');
    glob(src, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
}

(async () => {
  const devServer = await startDevServer();

  const files = await getTestFiles();
  files.forEach(f => mocha.addFile(f));

  mocha.run(function(failures) {
    process.on('exit', function() {
      process.exit(failures); // exit with non-zero status if there were failures
    });
    devServer.close();
  });
})();
