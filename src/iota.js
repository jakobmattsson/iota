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
    var target = iotaNilCreate();
    expression.value.forEach(function(messageChain) {
      target = context; // detta är inte nödvändigtvis lobby, bara när man evaluerar i översta scope
      messageChain.value.forEach(function(message) {
        target = evalMessage(context, target, message);
      });
    });
    return target;
  };
  var evalMessage = function(context, target, msg, lookupObject, justGet) {

    if (typeof lookupObject === "undefined") {
      lookupObject = target;
    }

    if (msg.keys.type.value == "string" || msg.keys.type.value == "number") {
      return msg.keys.value;
    }

    if (msg.keys.type.value == "comment") {
      return lookupObject;
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
    var invoke = function(t) {
      if (justGet || t.type != "function") {
        return t;
      } else {
        return t.value.call(target, iotaObjectCreate({
          callee: t,
          target: target,
          sender: context,
          message: msg
        }));
      }
    };

    if (lookupObject.keys[msg.keys.value.value]) {
      return invoke(lookupObject.keys[msg.keys.value.value]);
    } else {
      var result = null;
      if (typeof lookupObject.keys.protos === "undefined") {
        throw 'No response to message "' + msg.keys.value.value + '" at line ' + msg.keys.line.value + ', column ' + msg.keys.column.value;
      } else if (lookupObject.keys.protos.type == "array") {
        var matchedAny = traverse(lookupObject.keys.protos.value, msg.keys.value.value, function(item) {
          result = invoke(item.keys[msg.keys.value.value]);
        });
        if (!matchedAny) {
          throw "No matches!";
        }
      } else {
        result = evalMessage(context, lookupObject, msg, lookupObject.keys.protos);
      }

      return result;
    }
  };
  var evalToNumber = function(i, context, msg) {
    var x = evalExpression(i, context);
    if (x.type !== "number" || typeof x.value !== "number") {
      throw msg;
    }
    return x;
  };
  var evalToString = function(i, context, msg) {
    var x = evalExpression(i, context);
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

  var iotaObjectCreate = function(properties) {
    var o = {
      type: "cloned",
      value: "clone",
      keys: {
        protos: iotaArrayCreate([get('Object')])
      }
    };

    for (var key in properties) {
      if (properties.hasOwnProperty(key)) {
        o.keys[key] = properties[key];
      }
    }

    return o;
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
    return argument;
  };

  var def = function(prop, val) {
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
      target.keys[name] = iotaFunctionCreate(val);
    } else {
      target.keys[name] = val;
    }
  };
  var get = function(src, prop) {
    if (typeof prop === "undefined") {
      prop = src;
      src = lobby;
    }
    
    return prop.split(' ').reduce(function(acc, next) {
      if (!acc.keys[next]) {
        acc.keys[next] = {};
      }
      return acc.keys[next];
    }, src);
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
  def('Object delete', function(call) {
    delete this.keys[evalToString(call.keys.message.keys['arguments'].value[0], call.keys.sender).value];
    return this;
  });
  def('Object same', function(call) {
    return iotaBooleanCreate(this == evalExpression(call.keys.message.keys['arguments'].value[0], call.keys.sender));
  });
  def('Object send', function(call) {
    var evaledMsg = evalExpression(call.keys.message.keys['arguments'].value[0], call.keys.sender);
    return evalMessage(call.keys.sender, this, evaledMsg);
  });
  def('Object slot', function(call) {
    var name = call.keys.message.keys['arguments'].value[0];
    var value = call.keys.message.keys['arguments'].value[1];
    var len = call.keys.message.keys['arguments'].value.length;
    var slotName = evalToString(name, call.keys.sender).value;

    if (len == 1) {
      var nameMsg1 = name.value[0].value[0].keys;
      var msg = toIotaFormat({
        line: nameMsg1.line.value,
        column: nameMsg1.column.value,
        'arguments': [],
        value: slotName,
        type: 'symbol'
      });
      return evalMessage(call.keys.target, call.keys.target, msg, call.keys.target, true);
    } else {
      var val = evalExpression(value, call.keys.sender);
      this.keys[slotName] = val;
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
  def('Array length', function(call) {
    return iotaNumberCreate(call.keys.target.value.length);
  });
  def('Array push', function(call) {
    this.value.push(evalExpression(call.keys.message.keys['arguments'].value[0], call.keys.sender));
    return this;
  });
  def('Array tos', function(call) {
    if (this == get("Array")) {
      return iotaStringCreate("Array");
    }

    var str = "[ ";
    str += this.value.map(function(x, i) {
      var res = evalMessage(call.keys.sender, x, toIotaFormat({ value: 'tos', 'arguments': [], line: -1, column: -1, type: "symbol" }));
      return res.value;
    }).join(", ");
    str += " ]";
    return iotaStringCreate(str);
  });
  def('Array at', function(call) {
    var x = evalToNumber(call.keys.message.keys['arguments'].value[0], call.keys.sender, "The argument to Array.at must be a number");
    var result = this.value[x.value];
    return result;
  });

  def('Number protos', iotaArrayCreate([get("Object")]));
  def('Number +', function(call) {
    if (call.keys.message.keys['arguments'].value.length !== 1 || call.keys.message.keys['arguments'].value[0].length === 0) { // andra predikatet är för att förhindra "inget"
      throw "Number.+ must take exactly one argument";
    }
    var evaledX = evalToNumber(call.keys.message.keys['arguments'].value[0], call.keys.sender, "The argument to Number.+ must be a number");
    return iotaNumberCreate(this.value + evaledX.value);
  });
  def('Number -', function(call) {
    if (call.keys.message.keys['arguments'].value.length !== 1 || call.keys.message.keys['arguments'].value[0].length === 0) {
      throw "Number.- must take exactly one argument";
    }
    var evaledX = evalToNumber(call.keys.message.keys['arguments'].value[0], call.keys.sender, "The argument to Number.- must be a number");
    return iotaNumberCreate(this.value - evaledX.value);
  });
  def('Number *', function(call) {
    if (call.keys.message.keys['arguments'].value.length !== 1 || call.keys.message.keys['arguments'].value[0].length === 0) {
      throw "Number.* must take exactly one argument";
    }
    var evaledX = evalToNumber(call.keys.message.keys['arguments'].value[0], call.keys.sender, "The argument to Number.* must be a number");
    return iotaNumberCreate(this.value * evaledX.value);
  });
  def('Number /', function(call) {
    if (call.keys.message.keys['arguments'].value.length !== 1 || call.keys.message.keys['arguments'].value[0].length === 0) {
      throw "Number./ must take exactly one argument";
    }
    var evaledX = evalToNumber(call.keys.message.keys['arguments'].value[0], call.keys.sender, "The argument to Number./ must be a number");
    return iotaNumberCreate(this.value / evaledX.value);
  });
  def('Number <', function(call) {
    if (call.keys.message.keys['arguments'].value.length !== 1 || call.keys.message.keys['arguments'].value[0].length === 0) {
      throw "Number.< must take exactly one argument";
    }
    var evaledX = evalToNumber(call.keys.message.keys['arguments'].value[0], call.keys.sender, "The argument to Number.< must be a number");
    return iotaBooleanCreate(this.value < evaledX.value);
  });
  def('Number >', function(call) {
    if (call.keys.message.keys['arguments'].value.length !== 1 || call.keys.message.keys['arguments'].value[0].length === 0) {
      throw "Number.> must take exactly one argument";
    }
    var evaledX = evalToNumber(call.keys.message.keys['arguments'].value[0], call.keys.sender, "The argument to Number.> must be a number");
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
  def('String fromArray', function(call) {
    return iotaStringCreate(String.fromCharCode.apply(null, evalExpression(call.keys.message.keys['arguments'].value[0], call.keys.sender).value.map(function(e) {
      return e.value;
    })));
  });
  def('String tos', function() { return iotaStringCreate(this.value); });

  def('Message protos', iotaArrayCreate([get("Object")]));
  def('Message tos', function() {
    var msgToStr = function(msg) {
      var str = msg.keys.value.value;
      if (msg.keys.arguments.value.length > 0) {
        str += "(";
        str += msg.keys.arguments.value.map(function(x) {
          return x.value.map(function(y) {
            return y.value.map(function(z) {
              return msgToStr(z);
            }).join(" ");
          }).join("\n");
        }).join(", ");
        str += ")";
      }
      return str;
    };
    return iotaStringCreate(msgToStr(this));
  });

  def('if', function(call) {
    var len = call.keys.message.keys['arguments'].value.length;
    var x = call.keys.message.keys['arguments'].value[0];
    var y = call.keys.message.keys['arguments'].value[1];
    var z = call.keys.message.keys['arguments'].value[2];

    if (!isFalsy(evalExpression(x, call.keys.sender))) {
      return evalExpression(y, call.keys.sender);
    } else if (len > 2) {
      return evalExpression(z, call.keys.sender);
    }
  });
  def('while', function(call) {
    var condition = call.keys.message.keys['arguments'].value[0];
    var expression = call.keys.message.keys['arguments'].value[1];
    
    var result = iotaNilCreate();
    while (!isFalsy(evalExpression(condition, call.keys.sender))) {
      result = evalExpression(expression, call.keys.sender);
    }
    return result;
  });
  def('new', function() { return { type: 'new', keys: {} }; });
  def('true', function() { return iotaBooleanCreate(true); });
  def('false', function() { return iotaBooleanCreate(false); });
  def('nil', function() { return iotaNilCreate(); });
  def('func', function(origin) {
    var f = iotaFunctionCreate(function(call) {
      return evalExpression(get(call, 'callee origin message arguments').value[0], {
        type: "locals",
        keys: {
          protos: iotaArrayCreate([
            get(call, 'target'),
            get(call, 'callee origin sender')
          ]),
          call: call
        }
      });
    });
    f.keys.origin = origin;
    return f;
  });
  def('println', function(call) {
    var x = call.keys.message.keys['arguments'].value[0];
    var e = evalExpression(x, call.keys.sender);
    var after = evalMessage(call.keys.sender, e, toIotaFormat({ value: 'tos', 'arguments': [], line: -1, column: -1, type: "symbol" }));
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
      console.log(str);
      throw str;
    };
  }

  try {
    var m = toIotaFormat(messages);
    retypeArgument(m);
    evalExpression(m, lobby);
  } catch (ex) {
    evalConfig.error(ex);
  }
};

if (exports) {
  exports.tokenize = tokenize;
  exports.parse = parse;
  exports.interpret = interpret;
}
