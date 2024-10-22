const fs = require('fs').promises;
const http = require('http');
const { Command } = require('commander');
const path = require('path');

const program = new Command();

program
  .requiredOption('-h, --host <address>', 'Address of the server')
  .requiredOption('-p, --port <number>', 'Port of the server')
  .requiredOption('-c, --cache <path>', 'Path to cache directory')
  .parse(process.argv);

const options = program.opts();

const cacheFilePath = (statusCode) => path.join(options.cache, `${statusCode}.jpg`);

const handleRequest = async (req, res) => {
  const statusCode = req.url.slice(1); // Отримуємо код зі шляху, наприклад, /200
  const filePath = cacheFilePath(statusCode);

  //try {
    if (req.method === 'GET') {
      // Отримання картинки
      const data = await fs.readFile(filePath);
      res.writeHead(200, { 'Content-Type': 'image/jpg' });
      console.log(filePath); 
      res.end(data);
    } else if (req.method === 'PUT') {
      // Запис картинки
      let data = [];
      req.on('data', chunk => data.push(chunk));
      req.on('end', async () => {
        data = Buffer.concat(data);
        await fs.writeFile(filePath, data);
        res.writeHead(201, { 'Content-Type': 'text/plain' });
        res.end('Created');
      });
    } else if (req.method === 'DELETE') {
      // Видалення картинки
      await fs.unlink(filePath);
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Deleted');
    } else {
      // Метод не підтримується
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('Method Not Allowed');
    }
/*  } catch (err) {
    if (err.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    } else {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Server Error');
    }
  }*/
};

const server = http.createServer(handleRequest);

server.listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}/`);
});

