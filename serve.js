const http = require('http');
const fs = require('fs');
const path = require('path');

let PORT = process.env.PORT ? parseInt(process.env.PORT) : 8085;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.mpeg': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  
  const filePath = path.join(__dirname, reqPath);
  const ext = path.extname(filePath).toLowerCase();
  
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found: ' + reqPath);
      return;
    }

    const contentType = MIME[ext] || 'application/octet-stream';
    const range = req.headers.range;

    if (req.method === 'HEAD') {
      res.writeHead(200, {
        'Content-Length': stats.size,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes'
      });
      res.end();
      return;
    }

    if (range && (ext === '.mp4' || ext === '.mp3' || ext === '.mpeg')) {
      const match = range.replace(/bytes=/, "").trim();
      const parts = match.split("-");
      let start, end;

      if (parts[0] === "" && parts[1] !== "") {
        const suffix = parseInt(parts[1], 10);
        start = Math.max(0, stats.size - suffix);
        end = stats.size - 1;
      } else {
        start = parseInt(parts[0], 10);
        end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      }

      if (isNaN(start) || start < 0) start = 0;
      if (isNaN(end) || end >= stats.size) end = stats.size - 1;
      if (start > end) start = end;

      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      });
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': stats.size,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes'
      });
      fs.createReadStream(filePath).pipe(res);
    }
  });
});

function startServer() {
  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    PORT++;
    startServer();
  } else {
    console.error(err);
  }
});

startServer();
