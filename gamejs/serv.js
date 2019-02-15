let fs = require('fs');
let http = require('http');
let PORT = 4000
let INDEX = "test.html"

function send_error(res, code, msg) {
  if (arguments.length != 3) {
    console.log(arguments)
    throw new Error("need 3 arguments to send_error()");
  }
  
  let buf = `<!doctype html>
<html>
<head><title>Error: ${code}</title></head>
<body>
<h1>${msg}</h1>
</body>
</html>
  `
  res.setHeader("Content-Type", "text/html");
  res.setHeader("Content-Length", buf.length);
  res.writeHead(code);
  res.write(buf);
  res.end();
}

function normpath(path) {
  path = path.trim();
  
  if (path.search(/\.\./) >= 0) {
    //evil! relative path!
    return undefined;
  }
  
  path = path.replace(/\\/g, "/")
  
  while (path.startsWith("/")) {
    path = path.slice(1, path.length).trim();
  }
  
  if (path == "/" || path == "") {
    return INDEX;
  }
  
  if (!fs.existsSync(path)) {
    console.log("path does not exist", path);
    return undefined;
  }
  
  return path;
}

function send_error(res, code, msg) {
  if (arguments.length != 3) {
    console.log(arguments)
    throw new Error("need 3 arguments to send_error()");
  }
  
  let buf = `<!doctype html>
<html>
<head><title>Error: ${code}</title></head>
<body>
<h1>${msg}</h1>
</body>
</html>
  `
  res.setHeader("Content-Type", "text/html");
  res.setHeader("Content-Length", buf.length);
  res.writeHead(code);
  res.write(buf);
  res.end();
}

let mimemap = {
  "js"    : "application/x-javascript",
  "mjs"    : "application/x-javascript",
  "html"  : "text/html",
  "json"  : "text/json",
  "png"   : "image/png",
  "jpg"   : "image/jpeg",
  "fx"    : "text/code",
  "glsl"  : "text/code",
  "obj"   : "text/plain",
  "stl"   : "text/plain",
  "default" : "text/plain"
};

function getext(path) {
  let i = path.length-1;
  
  let ext = "";
  
  while (i > 0 && path[i] != ".") {
    ext = path[i] + ext;
    i--;
  }
  
  return ext.trim().toLowerCase();
}

function routeStaticFile(path, req, res) {
  let buf;
  
  try {
    buf = fs.readFileSync(path, "ascii");
  } catch (error) {
    console.warn("Failed to read path", path);
    return false;
  }
  
  let ext = getext(path);
  let mime;
  if (ext in mimemap) {
    mime = mimemap[ext];
  } else {
    mime = mimemap["default"];
  }
  
  res.setHeader("Content-Type", mime);
  res.setHeader("Content-Length", buf.length);
  res.writeHead(200)
  res.write(buf);
  res.end();
  
  return true;
}

function router(req, res) {
  let url = req.url;
  
  path = normpath(url);
  
  if (path === undefined) {
    return false;
  }
  
  return routeStaticFile(path, req, res);
  
  return false;
}

let serv = http.createServer((req, res) => {
  if (!router(req, res)) {
    send_error(res, 404, "file not found");
  }
  
  let line = `\u001b[34;1m[${req.method}]\u001b[0m \u001b[32;1m${req.url}\u001b[0m`;
  console.log(line);
  res.end();
});

console.log("Serving at port", PORT);
serv.listen(PORT);
