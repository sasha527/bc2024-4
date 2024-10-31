const fs = require('fs').promises;            //модуль фс також і для await
const http = require('http');                  // для створення сервера
const { Command } = require('commander');
const path = require('path');                  //path для роботи зі шляхами до файлів
const superagent = require("superagent");       //для створення http запитів

const program = new Command();                  //екземпляр

program
  .requiredOption('-h, --host <address>', 'Address of the server')      
  .requiredOption('-p, --port <number>', 'Port of the server')            
  .requiredOption('-c, --cache <path>', 'Path to cache directory')
  .parse(process.argv);                                               //парс аргументів

const options = program.opts();                             //зберігаємо в консту                      

const cacheFilePath = (statusCode) => path.join(options.cache, `${statusCode}.jpg`); //створює шлях до файлу кешу, використовуючи статусний код як ім'я файлу.

const handleRequest = async (req, res) => {
  const statusCode = req.url.slice(1); // витягнення коду статусу з url, напр 200. слайс потрібний для видалення першого символу / щоб створити шлях до кешу
  const filePath = cacheFilePath(statusCode); // щоб створити шлях до файлу кешу для цього статусного коду ;

  try {
    if (req.method === 'GET') {                             //якщо в нас метод гет
      try {
          const data = await fs.readFile(filePath);         //то спочатку читаємо файл і записуємо в консту дата
          res.writeHead(200, { 'Content-Type': 'image/jpg' });  //якщо все добре, то відповідно надсилається цей файл
          res.end(data);
      } catch (err) {                                         //якщо в нас не знайдена картинка, то використовуємо котів
          const catUrl = `https://http.cat/${statusCode}`;    // запит до https://http.cat, зображення для конкретного статусу коду
          try {
              const catResponse = await superagent.get(catUrl); // асинхронно за допомогою суперагент.гет
              const image = catResponse.body;                           //саме зображення
  
              await fs.writeFile(filePath, image);                      // зберігаємо картинку в кеш за вказаним шляхом
  
              res.writeHead(200, { 'Content-Type': 'image/jpg' });       // картинка з успішним статус кодом
              res.end(image);
          } catch (error) {
              console.log(error);                                       // якщо запит до https://http.cat завершився помилкою
              res.writeHead(404, { 'Content-Type': 'text/plain' });     //то 404 нот фаунд
              res.end('404 Not Found');
          }
      }
  }
   else if (req.method === 'PUT') {                                 //якщо в нас запит PUT то зберігаємо нову картинку у кеш
      let data = [];                                                //масивчик для розбитих на чанки великих файлів
      req.on('data', chunk => data.push(chunk));                    // обробляє кожен чанк і відправляє в масив дата
      req.on('end', async () => {
        data = Buffer.concat(data);                   // з'єднує в один цілий буфер
        await fs.writeFile(filePath, data);             // запис нашої картинки в файл
        res.writeHead(201, { 'Content-Type': 'text/plain' }); //статус код
        res.end('Created');     //ну і повідомлення про створення
      });
    } else if (req.method === 'DELETE') {               //якщо деліт то видаляємо картинку з кешу
      await fs.unlink(filePath);    // видалення файлу з системи
      res.writeHead(200, { 'Content-Type': 'text/plain' }); //статускод
      res.end('Deleted'); // підтвердження цього
    } else {
      res.writeHead(405, { 'Content-Type': 'text/plain' });    //статус код 405 якщо метод гет пут або деліт по якійсь причині не підтримується
      res.end('Method Not Allowed');                            //і відповідно повідомлення про це
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });   // якщо файл не знайдено, відправляємо статускод 404 not found
      res.end('Not Found');
    } else {
      res.writeHead(500, { 'Content-Type': 'text/plain' });   //Internal Server Error (це вже знач загальна помилка сервера, якщо не 404)
      res.end('Server Error');
    }
  }
};

const server = http.createServer(handleRequest);       //створ. серверу з функцією обробником хендл реквест яка відповідає на те як сервер реагує на вхідний запит

server.listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}/`);   //запускаємо сервер на вказаному хості та порту
});

