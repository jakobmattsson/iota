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
        while (i < line.length && 48 <= charCode(line[i]) && charCode(line[i]) <= 57) {
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
            } else if (stringSymbols.indexOf(line[i]) != -1) {
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

var interpret = function(messages, config) {

  var evalExpression = function(expression, context) {
    return expression.value.reduce(function(unused, messageChain) {
      return messageChain.value.reduce(function(target, message) {

        // Dessa två finns till för att stoppa oändlig rekursion mellan "send" och "slot"
        if (message.keys.type.value == "string" || message.keys.type.value == "number") {
          return message.keys.value;
        }
        if (message.keys.type.value == "comment") {
          return target;
        }
        if (message.keys.type.value == "symbol") {
          console.log("symbol", message.keys.value.value);
        }




        // hitta slotten "send"
        var f = findMethod("send", target);

        
        console.log("do activate")
        return activateIotaField(f, target, context, {
          keys: {
            type: toIotaFormat('symbol'),
            value: toIotaFormat("send"),
            line: toIotaFormat(-1),
            column: toIotaFormat(-1),
            //'arguments': message,
            'arguments': iotaArrayCreate([iotaArrayCreate([iotaArrayCreate([message])])]),
          }
        });
        
        
        
        // console.log("message", message);
        // 
        // if (f.type == "function") {
        //   var co = {
        //     keys: {
        //       protos: iotaArrayCreate([get('Object')]),
        //       callee: f,
        //       target: target,
        //       sender: context,
        //       message: message
        //     }
        //   };
        // 
        //   console.log("first way", message.keys.arguments.value)
        //   return f.value.call(co.keys.target, co);
        // } else {
        //   console.log("second way")
        //   return f;
        // }

        return evalMessage(context, target, message);
      }, context);
    }, toIotaFormat(null));
  };
  var evalMessage = function(context, target, msg, lookupObject, justGet) {

    if (typeof lookupObject === "undefined") {
      lookupObject = target;
    }

    // Denna är duplicerad, görs redan
    if (msg.keys.type.value == "string" || msg.keys.type.value == "number") {
      return msg.keys.value;
    }

    // Också duplicerad
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
        var callObject = {
          keys: {
            protos: iotaArrayCreate([get('Object')]),
            callee: t,
            target: target,
            sender: context,
            message: msg
          }
        };
        return t.value.call(target, callObject);
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
        result = evalMessage(context, lookupObject, msg, lookupObject.keys.protos, justGet);
      }

      return result;
    }
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

  var iotaArrayCreate = function(data) {
    var result = {
      type: "array",
      value: data,
      keys: {
        protos: get('Array')
      }
    };

    return result;
  };
  var toIotaFormat = (function() {
    return function(x) {
      
      if (x === null) {
        return {
          keys: {
            protos: iotaArrayCreate([get('Nil')])
          }
        };
      }
      if (typeof x === 'string') {
        return {
          type: "string",
          value: x,
          keys: {
            protos: iotaArrayCreate([get('String')])
          }
        };
      }
      if (typeof x === 'number') {
        return {
          type: "number",
          value: x,
          keys: {
            protos: iotaArrayCreate([get('Number')])
          }
        };
      }
      if (typeof x === 'boolean') {
        return {
          type: "bool",
          keys: {
            protos: iotaArrayCreate([get(x ? 'True' : 'False')])
          }
        }
      }
      if (typeof x === 'function') {
        return {
          type: "function",
          value: x,
          keys: {
            protos: iotaArrayCreate([get("Function")])
          }
        };
      }
      if (isArray(x)) {
        return iotaArrayCreate(x.map(toIotaFormat));
      }

      var o = {
        keys: {
          protos: iotaArrayCreate([get('Object')])
        }
      };

      Object.keys(x).forEach(function(key) {
        o.keys[key] = toIotaFormat(x[key]);
      });

      return o;
    };
  }());

  var retypeArgument = function(argument) {
    argument.value.forEach(function(a) {
      a.value.forEach(function(x) {
        x.type = "message";
        x.keys.protos = iotaArrayCreate([get('Message')]);
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
      target.keys[name] = toIotaFormat(val);
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


  // x f(1, 2)   <-- Denna borde använda send, så att logiken bara är definierad på ett ställe
  // x slot("f")
  // x send({ name: "f", arguments: [1, 2] }) <-- denna använder slot och sedan aktivierar resultatet, om möjligt

  var findMethod = function(name, target) {
    
    var slt = get('Object slot');

    var callObject = {
      keys: {
        protos: iotaArrayCreate([get('Object')]),
        callee: slt,
        target: target,
        sender: null, //what?
        message: toIotaFormat({
          type: "symbol",
          value: "slot",
          'arguments': [[[{
            type: "string",
            value: name,
            'arguments': [],
            line: -1,
            column: -1
          }]]],
          line: null, // what?
          column: null, // what?
        })
      }
    };
    var f = slt.value.call(callObject.keys.target, callObject);    
    return f;
  };

  var activateIotaField = function(f, target, sender, message) {

    if (f.type == "function") {
      var co = {
        keys: {
          protos: iotaArrayCreate([get('Object')]),
          callee: f,
          target: target,
          sender: sender,
          message: message
        }
      };

      return f.value.call(co.keys.target, co);
    } else {
      return f;
    }
  };



  def('Object clone', function() {
    return {
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
    return toIotaFormat(this == evalExpression(call.keys.message.keys['arguments'].value[0], call.keys.sender));
  });
  def('Object send', function(call) {
    // Denna använder "slot" för att hitta mottagaren av meddelandet
    // och sedan aktiverar den mottagaren, om det är en funktion

    console.log("send called 1", call.keys.message.keys['arguments'].value[0]);
    console.log("send called 2", call.keys.message.keys['arguments'].value[0].value[0].value.length);

    var isProcessed = false;

    if (call.keys.message.keys['arguments'].value.length == 1) {
      
      if (call.keys.message.keys['arguments'].value[0].value.length == 1) {
        if (call.keys.message.keys['arguments'].value[0].value[0].value.length == 1) {
          if (call.keys.message.keys['arguments'].value[0].value[0].value[0].type == "message") {
            isProcessed = true;
          }
        }
      }

    }


    if (isProcessed) {
      // console.log("is processed!");
      var xa = call.keys.message.keys['arguments'].value[0].value[0].value[0];
      console.log("guess 1", xa.keys.value.value);
      console.log("guess 2", xa.keys.arguments);

      var evaledMsg = evalExpression(call.keys.message.keys['arguments'].value[0], call.keys.sender);
      var nextArgs = evaledMsg.keys.arguments;
      var who = evaledMsg.keys.value.value;

      console.log("ans 1", who);
      console.log("ans 2", nextArgs);
    } else {
      var evaledMsg = evalExpression(call.keys.message.keys['arguments'].value[0], call.keys.sender);

      var nextArgs = evaledMsg.keys.arguments;
      var who = evaledMsg.keys.value.value;
    }



    console.log("find who", who)

    var f = findMethod(who, call.keys.target);



    return activateIotaField(f, call.keys.target, call.keys.sender, {
      keys: {
        type: toIotaFormat('symbol'),
        value: toIotaFormat(who),
        line: toIotaFormat(-1),
        column: toIotaFormat(-1),
        'arguments': nextArgs
      }
    });

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
      var r = evalMessage(call.keys.target, call.keys.target, msg, call.keys.target, true);
      return r;
    } else {
      var val = evalExpression(value, call.keys.sender);
      this.keys[slotName] = val;
      return this;
    }
  });
  def('Object slots', function() {
    return toIotaFormat(Object.keys(this.keys).sort(caseInsensitiveSortFunc));
  });
  def('Object tos', function() {
    return toIotaFormat("{ " + Object.keys(this.keys).sort(caseInsensitiveSortFunc).join(", ") + " }");
  });

  def('Array protos', iotaArrayCreate([get("Object")]));
  def('Array clone', function() {
    var result = {
      type: "array",
      value: [],
      keys: {
        protos: iotaArrayCreate([this])
      }
    };
    return result;
  });
  def('Array length', function(call) {
    return toIotaFormat(call.keys.target.value.length);
  });
  def('Array push', function(call) {
    this.value.push(evalExpression(call.keys.message.keys['arguments'].value[0], call.keys.sender));
    return this;
  });
  def('Array tos', function(call) {
    if (this == get("Array")) {
      return toIotaFormat("Array");
    }

    var str = "[ ";
    str += this.value.map(function(x, i) {

      var f = findMethod("tos", x);
      
      var apa = activateIotaField(f, x, call.keys.sender, {
        keys: {
          type: toIotaFormat('symbol'),
          value: toIotaFormat("tos"),
          line: toIotaFormat(-1),
          column: toIotaFormat(-1),
          'arguments': toIotaFormat([])
        }
      });
      return apa.value;

    }).join(", ");
    str += " ]";
    return toIotaFormat(str);
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
    return toIotaFormat(this.value + evaledX.value);
  });
  def('Number -', function(call) {
    if (call.keys.message.keys['arguments'].value.length !== 1 || call.keys.message.keys['arguments'].value[0].length === 0) {
      throw "Number.- must take exactly one argument";
    }
    var evaledX = evalToNumber(call.keys.message.keys['arguments'].value[0], call.keys.sender, "The argument to Number.- must be a number");
    return toIotaFormat(this.value - evaledX.value);
  });
  def('Number *', function(call) {
    if (call.keys.message.keys['arguments'].value.length !== 1 || call.keys.message.keys['arguments'].value[0].length === 0) {
      throw "Number.* must take exactly one argument";
    }
    var evaledX = evalToNumber(call.keys.message.keys['arguments'].value[0], call.keys.sender, "The argument to Number.* must be a number");
    return toIotaFormat(this.value * evaledX.value);
  });
  def('Number /', function(call) {
    if (call.keys.message.keys['arguments'].value.length !== 1 || call.keys.message.keys['arguments'].value[0].length === 0) {
      throw "Number./ must take exactly one argument";
    }
    var evaledX = evalToNumber(call.keys.message.keys['arguments'].value[0], call.keys.sender, "The argument to Number./ must be a number");
    return toIotaFormat(this.value / evaledX.value);
  });
  def('Number <', function(call) {
    if (call.keys.message.keys['arguments'].value.length !== 1 || call.keys.message.keys['arguments'].value[0].length === 0) {
      throw "Number.< must take exactly one argument";
    }
    var evaledX = evalToNumber(call.keys.message.keys['arguments'].value[0], call.keys.sender, "The argument to Number.< must be a number");
    return toIotaFormat(this.value < evaledX.value);
  });
  def('Number >', function(call) {
    if (call.keys.message.keys['arguments'].value.length !== 1 || call.keys.message.keys['arguments'].value[0].length === 0) {
      throw "Number.> must take exactly one argument";
    }
    var evaledX = evalToNumber(call.keys.message.keys['arguments'].value[0], call.keys.sender, "The argument to Number.> must be a number");
    return toIotaFormat(this.value > evaledX.value);
  });
  def('Number tos', function() {
    if (this == lobby.keys.Number) {
      return toIotaFormat("Number");
    } else {
      return toIotaFormat(this.value);
    }
  });

  def('Function tos', function() { return toIotaFormat("FUNCTION"); });
  def('Function protos', iotaArrayCreate([get("Object")]));

  def('Nil protos', iotaArrayCreate([get("Object")]));
  def('Nil tos', function() { return toIotaFormat("nil"); });

  def('True protos', iotaArrayCreate([get("Object")]));
  def('True tos', function() { return toIotaFormat("true"); });

  def('False protos', iotaArrayCreate([get("Object")]));
  def('False tos', function() { return toIotaFormat("false"); });

  def('String protos', iotaArrayCreate([get("Object")]));
  def('String parse', function() {
    try {
      var msgs = toIotaFormat(parse(tokenize(this.value)));
      retypeArgument(msgs);
      return msgs;
    } catch (ex) {
      return toIotaFormat(null);
    }
  });
  def('String toArray', function() { return toIotaFormat(stringToCharCodes(this.value)); });
  def('String fromArray', function(call) {
    return toIotaFormat(String.fromCharCode.apply(null, evalExpression(call.keys.message.keys['arguments'].value[0], call.keys.sender).value.map(function(e) {
      return e.value;
    })));
  });
  def('String tos', function() { return toIotaFormat(this.value); });

  def('Message protos', iotaArrayCreate([get("Object")]));
  def('Message tos', function() {
    var msgToStr = function(msg) {
      var str = msg.keys.value.value;
      if (msg.keys['arguments'].value.length > 0) {
        str += "(";
        str += msg.keys['arguments'].value.map(function(x) {
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
    return toIotaFormat(msgToStr(this));
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
    
    var result = toIotaFormat(null);
    while (!isFalsy(evalExpression(condition, call.keys.sender))) {
      result = evalExpression(expression, call.keys.sender);
    }
    return result;
  });
  def('new', function() { return { type: 'new', keys: {} }; });
  def('true', function() { return toIotaFormat(true); });
  def('false', function() { return toIotaFormat(false); });
  def('nil', function() { return toIotaFormat(null); });
  def('func', function(origin) {
    var f = toIotaFormat(function(call) {
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

    var f = findMethod("tos", e);

    var after = activateIotaField(f, e, call.keys.sender, {
      keys: {
        type: toIotaFormat('symbol'),
        value: toIotaFormat("tos"),
        line: toIotaFormat(-1),
        column: toIotaFormat(-1),
        'arguments': toIotaFormat([])
      }
    })

    var line = x.value.map(function(e) { return e.value; })[0][0].keys.line.value;
    config.println(after.value, line);
  });
  def('protos', iotaArrayCreate([get("Object")]));

  config = config || {};
  config.println = config.println || function(str) {
    console.log(str);
  };
  config.error = config.error || function(str) {
    console.log("error:", str);
    throw str;
  };

  try {
    var m = toIotaFormat(messages);
    retypeArgument(m);
    evalExpression(m, lobby);
  } catch (ex) {
    config.error(ex);
  }
};

if (exports) {
  exports.tokenize = tokenize;
  exports.parse = parse;
  exports.interpret = interpret;
}
