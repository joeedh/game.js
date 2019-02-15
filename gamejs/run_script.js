let args = process.argv;

let cp = require("child_process");

if (args.length < 3) {
  console.log("expected a script");
  process.exit(-1);
}

let path = args[2];
args = args.slice(2, args.length);

console.log("running", path);
console.log(args);

let env = {
  NODE_OPTIONS : "--experimental-modules --loader ./nodejs_es6_loader.mjs"
}

let proc = cp.exec("node " + path, {env : env}, (error, stdout, stderr) => {
  console.log(stdout);
  console.log(stderr);
  if (error) {
    process.exit(-1);
  }
});
