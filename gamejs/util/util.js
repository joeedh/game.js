"use strict";

import './polyfill.js'
import './typesystem.js'

var EmptySlot = {};

//uses hex
export function btoa(buf) {
  if (typeof buf == "string") {
    var b = [];
    for (var i=0; i<buf.length; i++) {
      b.push(buf.charCodeAt(i));
    }
    buf = b;
  }

  if (buf instanceof ArrayBuffer) {
    buf = new Uint8Array(buf);
  }

  var ret = "";
  for (var i=0; i<buf.length; i++) {
    var s = buf[i].toString(16);
    while (s.length < 2) {
      s = "0" + s;
    }

    ret += s;
  }

  return ret;
};

export function atob(buf) {
  var ret = [];

  for (var i=0; i<buf.length/2; i++) {
    ret.push(parseInt(buf.slice(i*2, i*2+2), 16));
  }

  return new Uint8Array(ret).buffer;
}

export function time_ms() {
  if (window.performance)
    return window.performance.now();
  else
    return new Date().getMilliseconds();
}

export function color2css(c) {
  var ret = c.length == 3 ? "rgb(" : "rgba(";
  
  for (var i=0; i<3; i++) {
    if (i > 0)
      ret += ",";
    
    ret += ~~(c[i]*255);
  }
  
  if (c.length == 4)
    ret += "," + c[3];
  ret += ")";
  
  return ret;
}

export function merge(obja, objb) {
  var ret = {};
  
  for (var k in obja) {
    ret[k] = obja[k];
  }
  
  for (var k in objb) {
    ret[k] = objb[k];
  }
  
  return ret;
};

export class  cachering extends Array {
  constructor(func, size) {
    super()
    
    this.cur = 0;
    
    for (var i=0; i<size; i++) {
      this.push(func());
    }
  }
  
  static fromConstructor(cls, size) {
    var func = function() {
      return new cls();
    }
    
    return new cachering(func, size);
  }
  
  next() {
    var ret = this[this.cur];
    this.cur = (this.cur+1)%this.length;
    
    return ret;
  }
}

export var set = Set;

export class HashIter {
  constructor(hash) {
    this.hash = hash;
    this.i = 0;
    this.ret = {done : false, value : undefined};
  }
  
  next() {
    var items = this.hash._items;
    
    if (this.i >= items.length) {
      this.ret.done = true;
      this.ret.value = undefined;
      
      return this.ret;
    }
    
    do {
      this.i += 2;
    } while (this.i < items.length && items[i] === _hash_null);
    
    return this.ret;
  }
}

var _hash_null = {};
export class hashtable {
  constructor() {
    this._items = [];
    this._keys = {};
    this.length = 0;
  }
  
  [Symbol.iterator]() {
    return new HashIter(this);
  }
  
  set(key, val) {
    var key2 = key[Symbol.keystr]();
    
    var i;
    if (!(key2 in this._keys)) {
      i = this._items.length;
      
      try {
        this._items.push(0);
        this._items.push(0);
      } catch(error) {
        console.log(":::", this._items.length, key, key2, val)
        throw error;
      }
      
      this._keys[key2] = i;
      this.length++;
    } else {
      i = this._keys[key2];
    }
    
    this._items[i] = key;
    this._items[i+1] = val;
  }
  
  remove(key) {
    var key2 = key[Symbol.keystr]();
    
    if (!(key2 in this._keys)) {
      console.trace("Warning, key not in hashtable:", key, key2);
      return;
    }
    
    var i = this._keys[key2];
    
    this._items[i] = _hash_null;
    this._items[i+1] = _hash_null;
    
    delete this._keys[key2];
    this.length--;
  }
  
  has(key) {
    var key2 = key[Symbol.keystr]();
    
    return key2 in this._keys;
  }
  
  get(key) {
    var key2 = key[Symbol.keystr]();
    
    if (!(key2 in this._keys)) {
      console.trace("Warning, item not in hash", key, key2);
      return undefined;
    }
    
    return this._items[this._keys[key2]+1];
  }
  
  add(key, val) {
    return this.set(key, val);
  }
  
  keys() {
    var ret = [];
    
    for (var i=0; i<this._items.length; i += 2) {
      var key = this._items[i];
      
      if (key !== _hash_null) {
        ret.push(key);
      }
    }
    
    return ret;
  }
  
  values() {
    var ret = [];
    
    for (var i=0; i<this._items.length; i += 2) {
      var item = this._items[i+1];
      
      if (item !== _hash_null) {
        ret.push(item);
      }
    }
    
    return ret;
  }
  
  forEach(cb, thisvar) {
    if (thisvar == undefined)
      thisvar = self;
    
    for (var k in this._keys) {
      var i = this._keys[k];
      
      cb.call(thisvar, k, this._items[i]);
    }
  }
}

export class IDGen {
  constructor() {
    this._cur = 1;
  }
  
  next() {
    return this._cur++;
  }
  
  max_cur(id) {
    this._cur = Math.max(this._cur, id+1);
  }
  
  toJSON() {
    return {
      _cur : this._cur
    };
  }
  
  static fromJSON(obj) {
    return new IDGen().loadJSON(obj);
  }
  
  loadJSON(obj) {
    this._cur = obj._cur;
    return this;
  }
}


function get_callstack(err) {
  var callstack = [];
  var isCallstackPopulated = false;

  var err_was_undefined = err == undefined;

  if (err == undefined) {
    try {
      _idontexist.idontexist+=0; //doesn't exist- that's the point
    } catch(err1) {
      err = err1;
    }
  }

  if (err != undefined) {
    if (err.stack) { //Firefox
      var lines = err.stack.split('\n');
      var len=lines.length;
      for (var i=0; i<len; i++) {
        if (1) {
          lines[i] = lines[i].replace(/@http\:\/\/.*\//, "|")
          var l = lines[i].split("|")
          lines[i] = l[1] + ": " + l[0]
          lines[i] = lines[i].trim()
          callstack.push(lines[i]);
        }
      }
      
      //Remove call to printStackTrace()
      if (err_was_undefined) {
        //callstack.shift();
      }
      isCallstackPopulated = true;
    }
    else if (window.opera && e.message) { //Opera
      var lines = err.message.split('\n');
      var len=lines.length;
      for (var i=0; i<len; i++) {
        if (lines[i].match(/^\s*[A-Za-z0-9\-_\$]+\(/)) {
          var entry = lines[i];
          //Append next line also since it has the file info
          if (lines[i+1]) {
            entry += ' at ' + lines[i+1];
            i++;
          }
          callstack.push(entry);
        }
      }
      //Remove call to printStackTrace()
      if (err_was_undefined) {
        callstack.shift();
      }
      isCallstackPopulated = true;
    }
   }

    var limit = 24;
    if (!isCallstackPopulated) { //IE and Safari
      var currentFunction = arguments.callee.caller;
      var i = 0;
      while (currentFunction && i < 24) {
        var fn = currentFunction.toString();
        var fname = fn.substring(fn.indexOf("function") + 8, fn.indexOf('')) || 'anonymous';
        callstack.push(fname);
        currentFunction = currentFunction.caller;
        
        i++;
      }
    }
  
  return callstack;
}

export function print_stack(err) {
  try {
    var cs = get_callstack(err);
  } catch (err2) {
    console.log("Could not fetch call stack.");
    return;
  }
  
  console.log("Callstack:");
  for (var i=0; i<cs.length; i++) {
    console.log(cs[i]);
  }
}

//from: https://en.wikipedia.org/wiki/Mersenne_Twister
function _int32(x) {
  // Get the 31 least significant bits.
  return ~~(((1<<30)-1) & (~~x))
}

export class MersenneRandom {
  constructor(seed) {
    // Initialize the index to 0
    this.index = 624;
    this.mt = new Uint32Array(624);

    this.seed(seed);
  }

  random() {
    return this.extract_number() / (1<<30);
  }

  seed(seed) {
    seed = ~~(seed*8192);

    // Initialize the index to 0
    this.index = 624;
    this.mt.fill(0, 0, this.mt.length);

    this.mt[0] = seed;  // Initialize the initial state to the seed

    for (var i=1; i<624; i++) {
      this.mt[i] = _int32(
        1812433253 * (this.mt[i - 1] ^ this.mt[i - 1] >> 30) + i);
    }
  }

  extract_number() {
    if (this.index >= 624)
      this.twist();

    var y = this.mt[this.index];

    // Right shift by 11 bits
    y = y ^ y >> 11;
    // Shift y left by 7 and take the bitwise and of 2636928640
    y = y ^ y << 7 & 2636928640;
    // Shift y left by 15 and take the bitwise and of y and 4022730752
    y = y ^ y << 15 & 4022730752;
    // Right shift by 18 bits
    y = y ^ y >> 18;

    this.index = this.index + 1;

    return _int32(y);
  }

  twist() {
    for (var i=0; i<624; i++) {
      // Get the most significant bit and add it to the less significant
      // bits of the next number
      var y = _int32((this.mt[i] & 0x80000000) +
        (this.mt[(i + 1) % 624] & 0x7fffffff));
      this.mt[i] = this.mt[(i + 397) % 624] ^ y >> 1;

      if (y % 2 != 0)
        this.mt[i] = this.mt[i] ^ 0x9908b0df;
    }

    this.index = 0;
  }
};

var _mt = new MersenneRandom(0);

export function random() {
  return _mt.extract_number() / (1<<30);
}

export function seed(n) {
//  console.trace("seed called");
  _mt.seed(n);
}

export function strhash(str) {
  var hash = 0;

  for (var i=0; i<str.length; i++) {
    var ch = str.charCodeAt(i);

    hash = (hash ^ ch);
    hash = hash < 0 ? -hash : hash;

    hash = (hash*232344 + 4323543) & ((1<<19)-1);
  }

  return hash;
}

var hashsizes = [
  /*2, 5, 11, 19, 37, 67, 127, */223, 383, 653, 1117, 1901, 3251,
   5527, 9397, 15991, 27191, 46229, 78593, 133631, 227177, 38619,
  656587, 1116209, 1897561, 3225883, 5484019, 9322861, 15848867,
  26943089, 45803279, 77865577, 132371489, 225031553
];

var FTAKEN=0, FKEY= 1, FVAL= 2, FTOT=3;

export class FastHash extends Array {
  constructor() {
    super();

    this.cursize = 0;
    this.size = hashsizes[this.cursize];
    this.used = 0;

    this.length = this.size*FTOT;
    this.fill(0, 0, this.length);
  }

  resize(size) {
    var table = this.slice(0, this.length);

    this.length = size*FTOT;
    this.size = size;
    this.fill(0, 0, this.length);

    for (var i=0; i<table.length; i += FTOT) {
      if (!table[i+FTAKEN]) continue;

      var key = table[i+FKEY], val = table[i+FVAL];
      this.set(key, val);
    }

    return this;
  }

  get(key) {
    var hash = typeof key == "string" ? strhash(key) : key;
    hash = typeof hash == "object" ? hash.valueOf() : hash;

    var probe = 0;

    var h = (hash + probe) % this.size;

    var _i = 0;
    while (_i++ < 50000 && this[h*FTOT+FTAKEN]) {
      if (this[h*FTOT+FKEY] ==  key) {
        return this[h*FTOT+FVAL];
      }

      probe = (probe+1)*2;
      h = (hash + probe) % this.size;
    }

    return undefined;
  }

  has(key) {
    var hash = typeof key == "string" ? strhash(key) : key;
    hash = typeof hash == "object" ? hash.valueOf() : hash;

    var probe = 0;

    var h = (hash + probe) % this.size;

    var _i = 0;
    while (_i++ < 50000 && this[h*FTOT+FTAKEN]) {
      if (this[h*FTOT+FKEY] ==  key) {
        return true;
      }

      probe = (probe+1)*2;
      h = (hash + probe) % this.size;
    }

    return false;
  }

  set(key, val) {
    var hash = typeof key == "string" ? strhash(key) : key;
    hash = typeof hash == "object" ? hash.valueOf() : hash;

    if (this.used > this.size/3) {
      this.resize(hashsizes[this.cursize++]);
    }

    var probe = 0;

    var h = (hash + probe) % this.size;

    var _i = 0;
    while (_i++ < 50000 && this[h*FTOT+FTAKEN]) {
      if (this[h*FTOT+FKEY] ==  key) {
        this[h*FTOT+FVAL] = val;
        return;
      }

      probe = (probe+1)*2;
      h = (hash + probe) % this.size;
    }

    this[h*FTOT+FTAKEN] = 1;
    this[h*FTOT+FKEY] = key;
    this[h*FTOT+FVAL] = val;

    this.used++;
  }
}

export function test_fasthash() {
  var h = new FastHash();
  console.log("bleh hash:", strhash("bleh"));

  h.set("bleh", 1);
  h.set("bleh", 2);
  h.set("bleh", 3);

  console.log(h);

  return h;
};

