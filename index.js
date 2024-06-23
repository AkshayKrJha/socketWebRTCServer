import express from 'express';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const server = createServer(app);

const __dirName = dirname(fileURLToPath(import.meta.url))

app.get('/', (req, res) => {
  res.sendFile(join(__dirName,"index.html"))
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});