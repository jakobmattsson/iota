var isArray = function(x) {
  if (Array.isArray) {
    return Array.isArray(x);
  } else {
    return Object.prototype.toString.call(x) === '[object Array]';
  }
};
var stringToCharCodes = function(str) {
  var codes = [];
  for ( var i=0; i<str.length; i++ ) {
    codes.push(str.charCodeAt(i));
  }
  return codes;
};
var caseInsensitiveSortFunc = function(a, b) { 
   al = a.toLowerCase();
   bl = b.toLowerCase();

   if (al == bl) {
     return a > b ? 1 : (a < b ? -1 : 0);
   } else {
     return al > bl ? 1 : -1;
   }
};


var tokenize = function(data) {
  if (data === null) {
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

    while (i < line.length) {
      if (exopSymbols.indexOf(line[i]) != -1) {
        tokens.push({ lexeme: line[i], type: 'symbol', line: lineNum+1, col: (i+1) });
        i++;
      } else if (charCode(line[i]) == 32) {
        i++;
      } else if (48 <= charCode(line[i]) && charCode(line[i]) <= 57) {
        var num = "";
        var col = i + 1;
        while (48 <= charCode(line[i]) && charCode(line[i]) <= 57) {
          num += line[i];
          i++;
        }
        tokens.push({ lexeme: num, type: 'number', line: lineNum+1, col: col });
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
      return { 'arguments': args, consumed: 0 };
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
        currLine.push({ type: tokens[i].type, value: tokens[i].type == "number" ? parseInt(tokens[i].lexeme, 10) : tokens[i].lexeme, 'arguments': [], line: tokens[i].line, column: tokens[i].col });
      } else if (tokens[i].type == "comment") {
        currLine.push({ type: "comment", value: tokens[i].lexeme, 'arguments': [], line: tokens[i].line, column: tokens[i].col });
      } else {
        var a = formArguments(tokens.slice(i+1));
        
        
        currLine.push({ type: "symbol", value: tokens[i].lexeme, 'arguments': a['arguments'] || [], line: tokens[i].line, column: tokens[i].col });
        i += a.consumed;
      }
      i++;
    }
    i++;
    if (currLine.length > 0) {
      currArg.push(currLine);
    }
    args.push(currArg);
    return { 'arguments': args, consumed: i };
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
  console.assert(result['arguments'].length == 1);

  return result['arguments'][0];
};

var interpret = function(messages, evalConfig) {

  var evalExpression = function(expression, context) {

    if (arguments.length < 2) {
      context = lobby;
    }

    expression.value.forEach(function(messageChain) {
      target = context; // detta är inte nödvändigtvis lobby, bara när man evaluerar i översta scope
      messageChain.value.forEach(function(message) {
        target = evalMessage(target, message);
      });
    });

    return target;
  };
  var evalMessage = function(target, msg, context) {

    if (typeof context === "undefined") {
      context = target;
    }

    if (msg.keys.type.value == "string" || msg.keys.type.value == "number") {
      return msg.keys.value;
    }

    if (msg.keys.type.value == "comment") {
      return target;
    }

    var traverse = function(items, name, callback) {
      for ( var i=0; i<items.length; i++ ) {
        if (items[i].keys[name]) {
          callback(items[i]);
          return true;
        } else if (typeof items[i].keys.protos !== "undefined"){
          var doBreak = false;
          traverse(items[i].keys.protos.value, name, function(item) {
            doBreak = true;
            callback(item);
          });
          if (doBreak) {
            return true;
          }
        }
      }
      return false;
    };
    var invoke = function(t, context, args) {
      if (t.type == "function") {
        return t.value.call(null, {
          target: context,
          sender: null,
          message: null,
          'arguments': args
        });
      } else {
        return t;
      }
    };

    if (target.keys[msg.keys.value.value]) {
      return invoke(target.keys[msg.keys.value.value], context, msg.keys['arguments'].value);
    } else {
      var result = null;
      if (typeof target.keys.protos === "undefined") {
        throw 'No response to message "' + msg.keys.value.value + '" at line ' + msg.keys.line.value + ', column ' + msg.keys.column.value;
      } else if (target.keys.protos.type == "array") {
        var matchedAny = traverse(target.keys.protos.value, msg.keys.value.value, function(item) {
          result = invoke(item.keys[msg.keys.value.value], context, msg.keys['arguments'].value);
        });
        if (!matchedAny) {
          throw "No matches!";
        }
      } else {
        result = evalMessage(target.keys.protos, msg, target);
      }

      return result;
    }
  };
  var evalToNumber = function(i, msg) {
    var x = evalExpression(i);
    if (x.type !== "number" || typeof x.value !== "number") {
      throw msg;
    }
    return x;
  };
  var evalToString = function(i, msg) {
    var x = evalExpression(i);
    if (x.type !== "string" || typeof x.value !== "string") {
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
      return x.keys.protos.value.some(isFalsy);
    } else {
      return isFalsy(x.keys.protos);
    }
  };

  var iotaArrayCreate = function(data, protos) {
    var result = {
      type: "array",
      value: data,
      keys: {
        protos: protos || get('Array')
      }
    };

    return result;
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
        protos: iotaArrayCreate([lobby.keys[bit ? 'True' : 'False']])
      }
    };
  };
  var iotaNilCreate = function() {
    return {
      type: "nil",
      value: "nada",
      keys: {
        protos: iotaArrayCreate([lobby.keys.Nil])
      }
    };
  };
  var iotaFunctionCreate = function(callback) {
    return {
      type: "function",
      value: callback,
      keys: {
        protos: iotaArrayCreate([get("Function")])
      }
    };
  };

  var toIotaFormat = function(x) {
    if (x === null) {
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
        protos: iotaArrayCreate([get('Object')])
      }
    };

    Object.keys(x).forEach(function(key) {
      o.keys[key] = toIotaFormat(x[key]);
    });

    return o;
  };

  var def = function(prop, val, properFunction) {
    var props = prop.split(' ');
    var name = props.slice(-1)[0];
    var target = props.slice(0, -1).reduce(function(acc, next) {
      if (!acc.keys[next]) {
        acc.keys[next] = {};
      }
      return acc.keys[next];
    }, lobby);

    if (!target.keys) {
      target.keys = {};
    }

    if (typeof val === 'function') {
      if (properFunction) {
        target.keys[name] = iotaFunctionCreate(val);
      } else {
        target.keys[name] = iotaFunctionCreate(function(call) {
          return val.apply(call.target, call['arguments']);
        });
      }
    } else {
      target.keys[name] = val;
    }
  };
  var get = function(prop) {
    return prop.split(' ').reduce(function(acc, next) {
      if (!acc.keys[next]) {
        acc.keys[next] = {};
      }
      return acc.keys[next];
    }, lobby);
  };

  var lobby = { keys: { Object: {}, Array: { value: [] }, Function: {} } };

  def('Object clone', function() {
    return {
      type: "cloned",
      value: "clone",
      keys: {
        protos: iotaArrayCreate([this])
      }
    };
  });
  def('Object delete', function(property) {
    delete this.keys[evalToString(property).value];
    return this;
  });
  def('Object same', function(x) {
    return iotaBooleanCreate(this == evalExpression(x));
  });
  def('Object send', function(msg) {
    var evaledMsg = evalExpression(msg);
    return evalMessage(this, evaledMsg);
  });
  def('Object slot', function(name, value) {
    var slotName = evalToString(name);
    if (arguments.length == 1) {
      var what = this.keys[slotName.value];
      return what;
    } else {
      var val = evalExpression(value);
      this.keys[slotName.value] = val;
      return this;
    }
  });
  def('Object slots', function() {
    var strings = Object.keys(this.keys).sort(caseInsensitiveSortFunc).map(function(str) {
      return iotaStringCreate(str);
    });
    return iotaArrayCreate(strings);
  });
  def('Object tos', function() {
    return iotaStringCreate("{ " + Object.keys(this.keys).sort(caseInsensitiveSortFunc).join(", ") + " }");
  });

  def('Array protos', iotaArrayCreate([get("Object")]));
  def('Array clone', function() {
    return iotaArrayCreate([], this);
  });
  def('Array length', function() {
    return iotaNumberCreate(this.value.length);
  });
  def('Array push', function(x) {
    this.value.push(evalExpression(x));
    return this;
  });
  def('Array tos', function() {
    if (this == get("Array")) {
      return iotaStringCreate("Array");
    }

    var str = "[ ";
    str += this.value.map(function(x, i) {
      var res = evalMessage(x, toIotaFormat({ value: 'tos', 'arguments': [], line: -1, column: -1, type: "symbol" }));
      return res.value;
    }).join(", ");
    str += " ]";
    return iotaStringCreate(str);
  });
  def('Array at', function(i) {
    var x = evalToNumber(i, "The argument to Array.at must be a number");
    var result = this.value[x.value];
    return result;
  });

  def('Number protos', iotaArrayCreate([get("Object")]));
  def('Number +', function(x) {
    if (arguments.length !== 1 || arguments[0].length === 0) { // andra predikatet är för att förhindra "inget"
      throw "Number.+ must take exactly one argument";
    }
    var evaledX = evalToNumber(x, "The argument to Number.+ must be a number");
    return iotaNumberCreate(this.value + evaledX.value);
  });
  def('Number -', function(x) {
    if (arguments.length !== 1 || arguments[0].length === 0) {
      throw "Number.- must take exactly one argument";
    }
    var evaledX = evalToNumber(x, "The argument to Number.- must be a number");
    return iotaNumberCreate(this.value - evaledX.value);
  });
  def('Number *', function(x) {
    if (arguments.length !== 1 || arguments[0].length === 0) {
      throw "Number.* must take exactly one argument";
    }
    var evaledX = evalToNumber(x, "The argument to Number.* must be a number");
    return iotaNumberCreate(this.value * evaledX.value);
  });
  def('Number /', function(x) {
    if (arguments.length !== 1 || arguments[0].length === 0) {
      throw "Number./ must take exactly one argument";
    }
    var evaledX = evalToNumber(x, "The argument to Number./ must be a number");
    return iotaNumberCreate(this.value / evaledX.value);
  });
  def('Number <', function(x) {
    if (arguments.length !== 1 || arguments[0].length === 0) {
      throw "Number.< must take exactly one argument";
    }
    var evaledX = evalToNumber(x, "The argument to Number.< must be a number");
    return iotaBooleanCreate(this.value < evaledX.value);
  });
  def('Number >', function(x) {
    if (arguments.length !== 1 || arguments[0].length === 0) {
      throw "Number.> must take exactly one argument";
    }
    var evaledX = evalToNumber(x, "The argument to Number.> must be a number");
    return iotaBooleanCreate(this.value > evaledX.value);
  });
  def('Number tos', function() {
    if (this == lobby.keys.Number) {
      return iotaStringCreate("Number");
    } else {
      return iotaStringCreate(this.value);
    }
  });

  def('Function tos', function() { return iotaStringCreate("FUNCTION"); });
  def('Function protos', iotaArrayCreate([get("Object")]));

  def('Nil protos', iotaArrayCreate([get("Object")]));
  def('Nil tos', function() { return iotaStringCreate("nil"); });

  def('True protos', iotaArrayCreate([get("Object")]));
  def('True tos', function() { return iotaStringCreate("true"); });

  def('False protos', iotaArrayCreate([get("Object")]));
  def('False tos', function() { return iotaStringCreate("false"); });

  def('String protos', iotaArrayCreate([get("Object")]));
  def('String parse', function() {
    var retypeArgument = function(argument) {
      argument.value.forEach(function(a) {
        a.value.forEach(function(x) {
          x.type = "message";
          x.keys.protos = iotaArrayCreate([lobby.keys.Message]);
          x.keys['arguments'].value.forEach(function(y) {
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
  });
  def('String toArray', function() {
    return iotaArrayCreate(stringToCharCodes(this.value).map(iotaNumberCreate));
  });
  def('String fromArray', function(x) {
    return iotaStringCreate(String.fromCharCode.apply(null, evalExpression(x).value.map(function(e) {
      return e.value;
    })));
  });
  def('String tos', function() { return iotaStringCreate(this.value); });

  def('Message protos', iotaArrayCreate([get("Object")]));
  def('Message tos', function() { return iotaStringCreate("a message"); });

  def('if', function(x, y, z) {
    if (!isFalsy(evalExpression(x))) {
      return evalExpression(y);
    } else if (arguments.length > 2) {
      return evalExpression(z);
    }
  });
  def('while', function(condition, expression) {
    var result = iotaNilCreate();
    while (!isFalsy(evalExpression(condition))) {
      result = evalExpression(expression);
    }
    return result;
  });
  def('new', function() { return { type: 'new', keys: {} }; });
  def('true', function() { return iotaBooleanCreate(true); });
  def('false', function() { return iotaBooleanCreate(false); });
  def('nil', function() { return iotaNilCreate(); });
  def('func', function(call) {

    throw "not implemented";

    var f = function(call) {
      
      console.log("Invoked user defined function");
      console.log(call);
      
      // här måste jag ha tillgång till
      // * target
      // * sender
      // * arguments (dessa har jag)
      // * message (det som aktiverade funktionen)
      
      // exekvera koden i body på något lämpligt sätt.
      
      
      
    };
    
    return iotaFunctionCreate(f);
  }, true);
  def('println', function(x) {
    var e = evalExpression(x);
    var after = evalMessage(e, toIotaFormat({ value: 'tos', 'arguments': [], line: -1, column: -1, type: "symbol" }));
    var line = x.value.map(function(e) { return e.value; })[0][0].keys.line.value;
    evalConfig.println(after.value, line);
  });
  def('protos', iotaArrayCreate([get("Object")]));

  evalConfig = evalConfig || {};
  if (!evalConfig.println) {
    evalConfig.println = function(str) {
      console.log(str);
    };
  }
  if (!evalConfig.error) {
    evalConfig.error = function(str) {
      throw str;
    };
  }
  
  try {
    evalExpression(toIotaFormat(messages));
  } catch (ex) {
    evalConfig.error(ex);
  }
};

if (exports) {
  exports.tokenize = tokenize;
  exports.parse = parse;
  exports.interpret = interpret;
}
