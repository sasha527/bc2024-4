const http = require('http');
const { Command } = require('commander');
const program = new Command();

program
  .requiredOption('-h, --host <address>', 'Address of the server')  // обов'язковий параметр
  .requiredOption('-p, --port <number>', 'Port of the server')     // обов'язковий параметр
  .requiredOption('-c, --cache <path>', 'Path to cache directory') // обов'язковий параметр
  .parse(process.argv);

const options = program.opts();

// Перевірка наявності обов'язкових параметрів
if (!options.host || !options.port || !options.cache) {
  console.error('Error: Missing required parameters');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello! This is a simple caching proxy server.');
});

server.listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}/`);
  console.log(`Cache directory is set to: ${options.cache}`);
});
