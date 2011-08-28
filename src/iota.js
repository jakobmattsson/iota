var isArray = function(x) {
  if (Array.isArray) {
    return Array.isArray(x);
  } else {
    return Object.prototype.toString.call(x) === '[object Array]';
  }
};


var tokenize = function(data) {
  if (data == null) {
    throw "The argument to tokenzie must be a non-null string";
  }

  var charCode = function(x) {
    return x.charCodeAt(0);
  };

  var lines = data.split('\n');
  var comments = ['#'];
  var exopSymbols = [',', '(', ')'];
  var stringSymbols = ['"', "'"];

  var tokens = [];

  lines.forEach(function(line, lineNum) {
    var i = 0;
    var sym = "";

    while (i < line.length) {
      if (exopSymbols.indexOf(line[i]) != -1) {
        tokens.push({ lexeme: line[i], type: 'symbol', line: lineNum+1, col: (i+1) });
        i++;
      } else if (charCode(line[i]) == 32) {
        i++;
      } else if (48 <= charCode(line[i]) && charCode(line[i]) <= 57) {
        var num = "";
        var currentCol = i + 1;
        while (48 <= charCode(line[i]) && charCode(line[i]) <= 57) {
          num += line[i];
          i++;
        }
        tokens.push({ lexeme: num, type: 'number', line: lineNum+1, col: currentCol });
      } else if (stringSymbols.indexOf(line[i]) != -1) {
        var str = "";
        var escape = false;
        var colStart = i+1;
        var delimiter = line[i];

        i++;

        while (line[i] != delimiter || escape) {
          if (!escape) {
            escape = line[i] == '\\';
            if (!escape) {
              str += line[i];
            }
          } else {
            if (line[i] == '\\') {
              str += "\\";
            } else if (line[i] == 't') {
              str += "\t";
            } else if (stringSymbols.some(function(sym) { return line[i] == sym; })) {
              str += "\\" + line[i];
            } else {
              console.log("Invalid escape sequence: ", line[i]);
              process.exit(0);
            }
            escape = false;
          }
          i++;
          if (i > line.length) {
            console.log("Unterminated string literal", line);
            process.exit(0);
          }
        }
        i++;
        tokens.push({ lexeme: str, type: 'string', line: lineNum+1, col: colStart });
      } else if (comments.indexOf(line[i]) != -1) {
        tokens.push({ lexeme: line.substring(i+1), type: 'comment', line: lineNum+1, col: (i+1) });
        break;
      } else {
        var sym = "";
        var currentCol = i + 1;
        while (i < line.length && exopSymbols.indexOf(line[i]) == -1 && charCode(line[i]) != 32 && comments.indexOf(line[i]) == -1) {
          sym += line[i];
          i++;
        }
        tokens.push({ lexeme: sym, type: 'symbol', line: lineNum+1, col: currentCol });
      }
    }
    tokens.push({ lexeme: '\n', type: 'symbol', line: lineNum+1, col: line.length });
  });
  return tokens;
};

var parse = function(tokens) {

  var formArguments = function(tokens) {

    if (tokens.length > 0 && tokens[0].type != "symbol" || tokens[0].lexeme != "(") {
      return { arguments: args, consumed: 0 };
    }

    var args = [];
    var currArg = [];
    var currLine = [];
    var i = 1;

    while (tokens[i].type != "symbol" || tokens[i].lexeme != ")") {
      if (i > tokens.length) {
        console.log("Unmatched parenthesis");
        process.exit(0);
      }

      if (tokens[i].type == "symbol" && tokens[i].lexeme == "\n") {
        if (currLine.length > 0) {
          currArg.push(currLine);
          currLine = [];
        }
      } else if (tokens[i].type == "symbol" && tokens[i].lexeme == ",") {
        if (currLine.length > 0) {
          currArg.push(currLine);
          currLine = [];
        }
        args.push(currArg);
        currArg = [];
      } else if (tokens[i].type == "string" || tokens[i].type == "number") {
        currLine.push({ name: null, value: tokens[i].type == "number" ? parseInt(tokens[i].lexeme, 10) : tokens[i].lexeme, comment: null, arguments: [], line: tokens[i].line, column: tokens[i].col });
      } else if (tokens[i].type == "comment") {
        currLine.push({ name: null, value: null, comment: tokens[i].lexeme, arguments: [], line: tokens[i].line, column: tokens[i].col });
      } else {
        var a = formArguments(tokens.slice(i+1));
        
        
        currLine.push({ name: tokens[i].lexeme, value: null, comment: null, arguments: a.arguments || [], line: tokens[i].line, column: tokens[i].col });
        i += a.consumed;
      }
      i++;
    }
    i++;
    if (currLine.length > 0) {
      currArg.push(currLine);
    }
    args.push(currArg);
    return { arguments: args, consumed: i };
  };

  var tks = [];
  tks.push({ lexeme: "(", type: "symbol", col: -1, row: -1 });
  tks = tks.concat(tokens);
  tks.push({ lexeme: ")", type: "symbol", col: -1, row: -1 });

  var result = formArguments(tks);
  
  if (result.consumed != tks.length) {
    var unmatched = tks[result.consumed-1];
    console.log("Unmatched parenthesis at line " + unmatched.line + ", column " + unmatched.col);
    process.exit(0);
  }
  console.assert(result.arguments.length == 1);

  return result.arguments[0];
}

var interpret = function(messages, evalConfig) {

  var traverse = function(items, name, callback) {
    for ( var i=0; i<items.length; i++ ) {
      if (items[i].keys[name]) {
        callback(items[i]);
        return true;
      } else if (typeof items[i].keys.protos !== "undefined"){
        var doBreak = false;
        traverse(items[i].keys.protos.value, name, function(item) {
          doBreak = true;
          callback(item)
        });
        if (doBreak) {
          return true;
        }
      }
    }
    return false;
  };
  var traverseAll = function(items, callback) {
    for ( var i=0; i<items.length; i++ ) {
      callback(items[i]);
      if (items[i].keys.protos) {
        traverseAll(items[i].keys.protos, callback);
      }
    }
  };
  var evalExp = function(messages, context) {

    if (arguments.length < 2) {
      context = lobby;
    }

    messages.value.forEach(function(line) {
      target = context; // detta är inte nödvändigtvis lobby, bara när man evaluerar i översta scope
      line.value.forEach(function(msg) {
        target = realSend(target, msg, target);
      });
    });

    return target;
  }
  var realSend = function(target, msg, context) {

    if (!isFalsy(msg.keys.value)) {
      return msg.value;
    }

    if (!isFalsy(msg.keys.comment)) {
      return target;
    }

    var invoke = function(t, context, args) {
      if (typeof t == "function") {
        throw "This should not be needed any more";
        return t.apply(context, args);
      } else {
        if (t.type == "function") {
          return t.value.apply(context, args);
        } else {
          return t;
        }
      }
    };

    console.log(msg.keys.name.type === "string");
    if (target.keys[msg.keys.name.value]) {
      var t = target.keys[msg.keys.name.value];
      return invoke(t, context, msg.keys.arguments.value);
    } else {
      var result = null;
      if (typeof target.keys.protos === "undefined") {
        throw "NO PROTOS";
      } else if (target.keys.protos.type == "array") {
        var matchedAny = traverse(target.keys.protos.value, msg.keys.name.value, function(item) {
          result = invoke(item.keys[msg.keys.name.value], context, msg.keys.arguments.value);
        });
        if (!matchedAny) {
          console.log("HERE:", msg.keys.name);
          throw "No matches!"
        }
      } else {
        result = realSend(target.keys.protos, msg, target);
      }

      return result;
    }
  };
  var evalToNumber = function(i, msg) {
    var x = evalExp(i);
    if (x.type !== "number" && typeof x.value !== "number") {
      throw msg;
    }
    return x;
  }
  var evalToString = function(i, msg) {
    var x = evalExp(i);
    if (x.type !== "string" && typeof x.value !== "string") {
      throw msg;
    }
    return x;
  };
  var isFalsy = function(x) {
    if (x == lobby.keys.Nil || x == lobby.keys.False) {
      return true;
    }
    if (typeof x.keys.protos === "undefined") {
      return false;
    }
    if (x.keys.protos.type == "array") {
      return x.keys.protos.value.some(function(v) {
        return isFalsy(v);
      });
    } else {
      return isFalsy(x.keys.protos);
    }
  };


  var caseInsensitiveSort = function(a, b) { 
     al = a.toLowerCase();
     bl = b.toLowerCase();

     if (al == bl) {
       return a > b ? 1 : (a < b ? -1 : 0);
     } else {
       return al > bl ? 1 : -1;
     }
  };

  var iotaObject = {};
  var iotaArray = { };
  var iotaArrayCreate = function(data, protos) {
    var result = {
      type: "array",
      value: data,
      keys: {
        protos: protos || iotaArray
      }
    };

    return result;
  };


  // ============================================================================
  // Prepare "Function"
  // ============================================================================

  var iotaFunction = {
    type: 'function root',
    keys: {
      protos: iotaArrayCreate([iotaObject])
    }
  };
  var iotaFunctionCreate = function(callback) {
    return {
      type: "function",
      value: callback,
      keys: {
        protos: iotaArrayCreate([iotaFunction])
      }
    };
  };
  iotaFunction.keys.tos = iotaFunctionCreate(function() { return iotaStringCreate("FUNCTION"); });



  // ============================================================================
  // Prepare "Object"
  // ============================================================================

  iotaObject.keys = {
    "clone": iotaFunctionCreate(function() {
      return {
        type: "cloned",
        value: "clone",
        keys: {
          protos: iotaArrayCreate([this])
        }
      }
    }),
    "delete": iotaFunctionCreate(function(property) {
      delete this.keys[evalToString(property).value];
      return this;
    }),
    "same": iotaFunctionCreate(function(x) {
      // returnera ett boolskt värde här istället för 1 eller 0
      return iotaBooleanCreate(this == evalExp(x));
    }),
    "send": iotaFunctionCreate(function(msg) {
      var evaledMsg = evalExp(msg);
      console.log(evaledMsg);
      return evalExp([evaledMsg], this);
    }),
    "slot": iotaFunctionCreate(function(name, value) {
      if (arguments.length == 1) {
        var slotName = evalToString(name);
        var what = this.keys[slotName.value];
        return what;
      } else {
        var slotName = evalToString(name);
        var val = evalExp(value);
        this.keys[slotName.value] = val;
        return this;
      }
    }),
    "slots": iotaFunctionCreate(function() {
      // dessa måste vara io-strängar, inte vanliga strängar
      var strings = Object.keys(this.keys).sort(caseInsensitiveSort);
      strings = strings.map(function(str) {
        return iotaStringCreate(str);
      });
      return iotaArrayCreate(strings);
    }),
    "tos": iotaFunctionCreate(function() {
      return iotaStringCreate("{ " + Object.keys(this.keys).sort(caseInsensitiveSort).join(", ") + " }");
    })
  };

  // ============================================================================
  // Prepare "Array"
  // ============================================================================


  iotaArray.value = [];
  iotaArray.keys = {
    "clone": iotaFunctionCreate(function() {
      return iotaArrayCreate([], this);
    }),
    "at": iotaFunctionCreate(function(i) {
      console.log("Array.at", i);
      console.log(i.value[0].value[0].keys.value)
      console.log(evalExp(i));
      
      var x = evalToNumber(i, "The argument to Array.at must be a number");
      var result = this.value[x.value];
      return result;
    }),
    "length": iotaFunctionCreate(function() {
      return iotaNumberCreate(this.value.length);
    }),
    "push": iotaFunctionCreate(function(x) {
      this.value.push(evalExp(x));
      return this;
    }),
    "tos": iotaFunctionCreate(function() {
      if (this == iotaArray) {
        return iotaStringCreate("Array");
      }

      var str = "[ ";
      str += this.value.map(function(x, i) {
        var res = realSend(x, toIotaFormat({ name: 'tos', arguments: [], line: -1, column: -1, value: null, comment: null }), x);
        return res.value;
      }).join(", ");
      str += " ]";
      return iotaStringCreate(str);
    })
  };
  iotaArray.keys.protos = iotaArrayCreate([iotaObject]);




  // ============================================================================
  // Prepare "Lobby"
  // ============================================================================

  var lobby = {
    keys: {
      "if": iotaFunctionCreate(function(x, y, z) {
        if (!isFalsy(evalExp(x))) {
          return evalExp(y);
        } else if (arguments.length > 2) {
          return evalExp(z);
        }
      }),
      "while": iotaFunctionCreate(function(condition, expression) {
        var result = iotaNilCreate();
        while (!isFalsy(evalExp(condition))) {
          result = evalExp(expression);
        }
        return result;
      }),
      "new": iotaFunctionCreate(function() { return { type: 'new', keys: {} }; }),
      "true": iotaFunctionCreate(function() { return iotaBooleanCreate(true); }),
      "false": iotaFunctionCreate(function() { return iotaBooleanCreate(false); }),
      "nil": iotaFunctionCreate(function() { return iotaNilCreate(); }),
      "func": iotaFunctionCreate(function() {
        throw "not implemented";
      }),
      "println": iotaFunctionCreate(function(x) {
        var e = evalExp(x);
        var after = realSend(e, toIotaFormat({ name: 'tos', arguments: [], line: -1, column: -1, value: null, comment: null }), e);
        var line = x.value.map(function(e) { return e.value; })[0][0].keys.line.value;
        evalConfig.println(after.value, line); // haxx in order to avoid matching this line when searching for console log's
      }),
      "protos": iotaArrayCreate([iotaObject]),
      "Object": iotaObject,
      "Array": iotaArray,
      "Function": iotaFunction,
      "Number": {
        keys: {
          protos: iotaArrayCreate([iotaObject]),
          '+': iotaFunctionCreate(function(x) {
            if (arguments.length != 1 || arguments[0].length == 0) { // andra predikatet är för att förhindra "inget"
              throw "Number.+ must take exactly one argument";
            }
            var evaledX = evalToNumber(x, "The argument to Number.+ must be a number");
            return iotaNumberCreate(this.value + evaledX.value);
          }),
          '-': iotaFunctionCreate(function(x) {
            if (arguments.length != 1 || arguments[0].length == 0) {
              throw "Number.- must take exactly one argument";
            }
            var evaledX = evalToNumber(x, "The argument to Number.- must be a number");
            return iotaNumberCreate(this.value - evaledX.value);
          }),
          '*': iotaFunctionCreate(function(x) {
            if (arguments.length != 1 || arguments[0].length == 0) {
              throw "Number.* must take exactly one argument";
            }
            var evaledX = evalToNumber(x, "The argument to Number.* must be a number");
            return iotaNumberCreate(this.value * evaledX.value);
          }),
          '/': iotaFunctionCreate(function(x) {
            if (arguments.length != 1 || arguments[0].length == 0) {
              throw "Number./ must take exactly one argument";
            }
            var evaledX = evalToNumber(x, "The argument to Number./ must be a number");
            return iotaNumberCreate(this.value / evaledX.value);
          }),
          '<': iotaFunctionCreate(function(x) {
            if (arguments.length != 1 || arguments[0].length == 0) {
              throw "Number.< must take exactly one argument";
            }
            var evaledX = evalToNumber(x, "The argument to Number.< must be a number");
            return iotaBooleanCreate(this.value < evaledX.value);
          }),
          '>': iotaFunctionCreate(function(x) {
            if (arguments.length != 1 || arguments[0].length == 0) {
              throw "Number.> must take exactly one argument";
            }
            var evaledX = evalToNumber(x, "The argument to Number.> must be a number");
            return iotaBooleanCreate(this.value > evaledX.value);
          }),
          tos: iotaFunctionCreate(function() {
            if (this == lobby.keys.Number) {
              return iotaStringCreate("Number");
            } else {
              return iotaStringCreate(this.value);
            }
          })
        }
      },
      "Nil": {
        keys: {
          protos: iotaArrayCreate([iotaObject]),
          tos: iotaFunctionCreate(function() { return iotaStringCreate("nil"); })
        }
      },
      "True": {
        keys: {
          protos: iotaArrayCreate([iotaObject]),
          tos: iotaFunctionCreate(function() { return iotaStringCreate("true"); })
        }
      },
      "False": {
        keys: {
          protos: iotaArrayCreate([iotaObject]),
          tos: iotaFunctionCreate(function() { return iotaStringCreate("false"); })
        }
      },
      "String": {
        keys: {
          protos: iotaArrayCreate([iotaObject]),
          parse: iotaFunctionCreate(function() {
            var retypeArgument = function(argument) {
              argument.value.forEach(function(a) {
                a.value.forEach(function(x) {
                  x.type = "message";
                  x.keys.protos = iotaArrayCreate([lobby.keys.Message]);
                  x.keys.arguments.value.forEach(function(y) {
                    retypeArgument(y);
                  });
                });
              });
            };

            try {
              var msgs = toIotaFormat(parse(tokenize(this.value)));
              retypeArgument(msgs);
              return msgs;
            } catch (ex) {
              return iotaNilCreate();
            }
          }),
          toArray: iotaFunctionCreate(function() {
            var vals = [];
            for ( var i=0; i<this.value.length; i++ ) {
              vals.push(iotaNumberCreate(this.value.charCodeAt(i)));
            }
            return iotaArrayCreate(vals);
          }),
          fromArray: iotaFunctionCreate(function(x) {
            return iotaStringCreate(String.fromCharCode.apply(null, evalExp(x).value.map(function(e) {
              return e.value;
            })));
          }),
          tos: iotaFunctionCreate(function() { return iotaStringCreate(this.value); })
        }
      },
      "Message": {
        keys: {
          protos: iotaArrayCreate([iotaObject]),
          tos: iotaFunctionCreate(function() { return iotaStringCreate("a message"); })
        }
      }
    }
  };

  var iotaStringCreate = function(str) {
    return {
      type: "string",
      value: str,
      keys: {
        protos: iotaArrayCreate([lobby.keys.String])
      }
    };
  };
  var iotaNumberCreate = function(num) {
    return {
      type: "number",
      value: num,
      keys: {
        protos: iotaArrayCreate([lobby.keys.Number])
      }
    };
  };
  var iotaBooleanCreate = function(bit) {
    return {
      type: "bool",
      keys: {
        protos: iotaArrayCreate([lobby.keys[bit ? 'True' : 'False']]),
      }
    }  
  };
  var iotaNilCreate = function() {
    return {
      type: "nil",
      value: "nada",
      keys: {
        protos: iotaArrayCreate([lobby.keys.Nil])
      },
    };
  };
  var toIotaFormat = function(x) {
    if (x == null) {
      return iotaNilCreate();
    }
    if (typeof x === 'string') {
      return iotaStringCreate(x);
    }
    if (typeof x === 'number') {
      return iotaNumberCreate(x);
    }
    if (typeof x === 'boolean') {
      return iotaBooleanCreate(x);
    }
    if (typeof x === 'function') {
      return iotaFunctionCreate(x);
    }
    if (isArray(x)) {
      return iotaArrayCreate(x.map(function(e) {
        return toIotaFormat(e);
      }));
    }

    var o = {
      type: "object",
      value: null,
      keys: {
        protos: iotaArrayCreate([lobby.keys.Object])
      }
    }

    Object.keys(x).forEach(function(key) {
      o.keys[key] = toIotaFormat(x[key]);
    });

    return o;
  };

  evalConfig = evalConfig || {};
  if (!evalConfig.println) {
    evalConfig.println = function(str) {
      console.log(str);
    };
  }
  var iotaMessages = toIotaFormat(messages);
  evalExp(iotaMessages);
};

if (exports) {
  exports.tokenize = tokenize;
  exports.parse = parse;
  exports.interpret = interpret;
}
