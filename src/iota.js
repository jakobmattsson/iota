var iota = (function() {
  var isArray = function(x) {
    return Array.isArray ? Array.isArray(x) : Object.prototype.toString.call(x) === '[object Array]';
  };
  var charCode = function(x) {
    return x.charCodeAt(0);
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
  var run = function(f) {
    return f();
  };

  var iota = {
    tokenize: function(data, config) {
      config = config || {};
      config.error = config.error || function(str) {
        console.log("error:", str);
      };

      try {
        if (data === null) {
          throw "The argument to tokenzie must be a non-null string";
        }

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
                    throw "Invalid escape sequence: " + line[i];
                  }
                  escape = false;
                }
                i++;
                if (i > line.length) {
                  throw "Unterminated string literal: " + line;
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
      } catch (ex) {
        config.error(ex);
      }
      return null;
    },
    parse: function(tokens, config) {
      config = config || {};
      config.callback = config.callback || function() { };
      config.error = config.error || function(str) {
        console.log("error:", str);
      };

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
            throw "Unmatched parenthesis";
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

      try {

        var groups = [];
        var next = [];
        var parens = 0;

        tokens.forEach(function(token) {
          next.push(token);

          if (token.lexeme == "(") {
            parens++;
          }
          if (token.lexeme == ")") {
            parens--;
          }
          if (parens === 0 && token.lexeme == "\n") {
            groups.push(next);
            next = [];
          }
        });

        if (next.length > 0) {
          groups.push(next);
        }

        groups.forEach(function(group) {
          var tks = [];
          tks.push({ lexeme: "(", type: "symbol", col: -1, row: -1 });
          tks = tks.concat(group);
          tks.push({ lexeme: ")", type: "symbol", col: -1, row: -1 });

          var result = formArguments(tks);

          if (result.consumed != tks.length) {
            var unmatched = tks[result.consumed-1];
            throw "Unmatched parenthesis at line " + unmatched.line + ", column " + unmatched.col;
          }
          
          
          
          
          config.callback(result['arguments'][0]);
        });
      } catch (ex) {
        config.error(ex);
      }
    },
    interpreter: function(config) {

      // The following should be isolated to as few places as possible:
      // * protos
      // * keys
      // * type
      // * value

      var evalExpression = function(expression, context) {
        return expression.value.reduce(function(unused, messageChain) {
          return messageChain.value.reduce(function(target, message) {

            // Dessa två finns till för att stoppa oändlig rekursion mellan "send" och "slot"
            if (raw(message, 'type') == "string" || raw(message, 'type') == "number") {
              return get(message, 'value');
            }
            if (raw(message, 'type') == "comment") {
              return target;
            }


            var f = findMethod("send", target, raw(message, 'line'), raw(message, 'column'));

            var xx = toIotaFormat({
              type: 'symbol',
              value: 'send',
              line: raw(message, 'line'),
              column: raw(message, 'column')
            });
            set(xx, 'arguments', iotaArrayCreate(iotaArrayCreate(iotaArrayCreate(message))));

            return activateIotaField(f, target, context, xx);
          }, context);
        }, toIotaFormat(null));
      };
      var isFalsy = function(x) {
        if (x == get('Nil') || x == get('False')) {
          return true;
        }

        if (typeof get(x, 'protos') === "undefined") {
          return false;
        }
        if (get(x, 'protos').type == "array") {
          return raw(x, 'protos').some(isFalsy);
        } else {
          return isFalsy(get(x, 'protos'));
        }
      };
      var findMethod = function(name, target, line, col) {
        var slot = get('Object slot');
        var f = raw(slot);
        var co = toIotaObject({
          message: toIotaFormat({
            type: 'symbol',
            value: 'slot',
            'arguments': [[[{
              type: 'string',
              value: name,
              'arguments': [],
              line: line,
              column: col
            }]]],
            line: line,
            column: col
          }),
          protos: iotaArrayCreate(get('Object')),
          callee: slot,
          target: target,
          sender: null
        });
        return f(co);
      };
      var activateIotaField = function(f, target, sender, message) {
        if (f.type == "function") {
          var func = raw(f);
          return func(toIotaObject({
            protos: iotaArrayCreate(get('Object')),
            callee: f,
            target: target,
            sender: sender,
            message: message
          }));
        } else {
          return f;
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

      var toIotaObject = function(x) {
        var o = {
          keys: {
            protos: iotaArrayCreate(get('Object'))
          }
        };

        Object.keys(x).forEach(function(key) {
          set(o, key, x[key]);
        });

        return o;
      };
      var iotaArrayCreate = function(data) {
        var result = {
          type: "array",
          value: isArray(data) ? data : Array.prototype.slice.call(arguments, 0),
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
                protos: iotaArrayCreate(get('Nil'))
              }
            };
          }
          if (typeof x === 'string') {
            return {
              type: "string",
              value: x,
              keys: {
                protos: iotaArrayCreate(get('String'))
              }
            };
          }
          if (typeof x === 'number') {
            return {
              type: "number",
              value: x,
              keys: {
                protos: iotaArrayCreate(get('Number'))
              }
            };
          }
          if (typeof x === 'boolean') {
            return {
              type: "bool",
              keys: {
                protos: iotaArrayCreate(get(x ? 'True' : 'False'))
              }
            };
          }
          if (typeof x === 'function') {
            return {
              type: "function",
              value: x,
              keys: {
                protos: iotaArrayCreate(get("Function"))
              }
            };
          }
          if (isArray(x)) {
            return iotaArrayCreate(x.map(toIotaFormat));
          }

          var o = {
            keys: {
              protos: iotaArrayCreate(get('Object'))
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
            set(x, 'protos', iotaArrayCreate(get('Message')));
            raw(x, 'arguments').forEach(function(y) {
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
          return typeof acc == "undefined" ? acc : acc.keys[next];
        }, src);
      };
      var set = function(object, name, value) {
        object.keys = object.keys || {};
        object.keys[name] = value;
        return object;
      };
      var raw = function(object, prop) {
        if (prop) {
          return get(object, prop).value;
        } else {
          return object.value;
        }
      };
      var del = function(object, prop) {
        delete object.keys[prop];
        return object;
      };

      var mathScaffold = function(name, callback) {
        return function(call) {
          // The second predicate is to prevent "nothing"
          if (raw(call, 'message arguments').length !== 1 || raw(call, 'message arguments')[0].length === 0) {
            throw name + " must take exactly one argument";
          }
          var evaled = evalToNumber(raw(call, 'message arguments')[0], get(call, 'sender'), "The argument to " + name + " must be a number");
          return toIotaFormat(callback(raw(call, 'target'), raw(evaled)));
        };
      };

      var lobby = {};
      set(lobby, 'Object', {});
      set(lobby, 'Array', { value: [] });
      set(lobby, 'Function', {});

      def('Object clone', function(call) {
        return toIotaObject({
          protos: iotaArrayCreate(get(call, 'target'))
        });
      });
      def('Object delete', function(call) {
        var x = raw(evalToString(raw(call, 'message arguments')[0], get(call, 'sender')));
        return del(get(call, 'target'), x);
      });
      def('Object same', function(call) {
        return toIotaFormat(get(call, 'target') == evalExpression(get(call, 'message arguments').value[0], get(call, 'sender')));
      });
      def('Object send', function(call) {
        if (call.keys.message.direct) {
          var result = evalExpression(raw(call, 'message arguments')[0], get(call, 'sender'));

          // Detta är riktigt haxxigt. Gör bättre.
          call.keys.message.keys['arguments'].value[0].value[0].value = [];
          call.keys.message.keys['arguments'].value[0].value[0].value[0] = result;
        }

        var xa = call.keys.message.keys['arguments'].value[0].value[0].value[0];
        var nextArgs = xa.keys['arguments'];
        var who = xa.keys.value.value;
        var f = findMethod(who, call.keys.target, get(call, "message line").value, get(call, "message column").value);

        return activateIotaField(f, call.keys.target, call.keys.sender, {
          direct: who === "send",
          keys: {
            protos: iotaArrayCreate(get('Message')),
            type: toIotaFormat('symbol'),
            value: toIotaFormat(who),
            line: toIotaFormat(-103),
            column: toIotaFormat(-103),
            'arguments': nextArgs
          }
        });
      });
      def('Object slot', run(function() {
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
        var evalMessage = function(context, target, msg, lookupObject) {

          if (typeof lookupObject === "undefined") {
            lookupObject = target;
          }

          if (lookupObject.keys[msg.keys.value.value]) {
            return lookupObject.keys[msg.keys.value.value];
          } else {
            var result = null;
            if (typeof lookupObject.keys.protos === "undefined") {
              throw 'No response to message "' + msg.keys.value.value + '" at line ' + msg.keys.line.value + ', column ' + msg.keys.column.value;
            } else if (lookupObject.keys.protos.type == "array") {
              var matchedAny = traverse(lookupObject.keys.protos.value, msg.keys.value.value, function(item) {
                result = item.keys[msg.keys.value.value];
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
        return function(call) {
          var name = raw(call, 'message arguments')[0];
          var value = raw(call, 'message arguments')[1];
          var len = raw(call, 'message arguments').length;
          var slotName = raw(evalToString(name, get(call, 'sender')));

          if (len == 1) {
            var nameMsg1 = name.value[0].value[0].keys;
            var msg = toIotaFormat({
              line: nameMsg1.line.value,
              column: nameMsg1.column.value,
              'arguments': [],
              value: slotName,
              type: 'symbol'
            });
            return evalMessage(get(call, 'sender'), get(call, 'target'), msg);
          } else {
            var val = evalExpression(value, get(call, 'sender'));
            set(get(call, 'target'), slotName, val);
            return get(call, 'target');
          }
        };
      }));
      def('Object slots', function(call) {
        return toIotaFormat(Object.keys(get(call, 'target').keys).sort(caseInsensitiveSortFunc));
      });
      def('Object tos', function(call) {
        return toIotaFormat("{ " + Object.keys(get(call, 'target').keys).sort(caseInsensitiveSortFunc).join(", ") + " }");
      });

      def('Array protos', iotaArrayCreate(get("Object")));
      def('Array length', function(call) { return toIotaFormat(raw(call, 'target').length); });
      def('Array clone', function(call) {
        var result = {
          type: "array",
          value: [],
          keys: {
            protos: iotaArrayCreate(get(call, 'target'))
          }
        };
        return result;
      });
      def('Array push', function(call) {
        raw(call, 'target').push(evalExpression(raw(call, 'message arguments')[0], get(call, 'sender')));
        return get(call, 'target');
      });
      def('Array tos', function(call) {
        if (get(call, 'target') == get("Array")) {
          return toIotaFormat("Array");
        }

        var str = "[ ";
        str += raw(call, 'target').map(function(x, i) {
          var f = findMethod('tos', x, raw(call, 'message line'), raw(call, 'message column'));
          return raw(activateIotaField(f, x, get(call, 'sender'), toIotaFormat({
            type: 'symbol',
            value: 'tos',
            line: raw(call, 'message line'),
            column: raw(call, 'message column'),
            'arguments': []
          })));
        }).join(", ");
        str += " ]";
        return toIotaFormat(str);
      });
      def('Array at', function(call) {
        var i = raw(evalToNumber(raw(call, 'message arguments')[0], get(call, 'target'), "The argument to Array.at must be a number"));
        return raw(call, 'target')[i];
      });

      def('Number protos', iotaArrayCreate(get("Object")));
      def('Number +', mathScaffold("Number.+", function(x, y) { return x + y; }));
      def('Number -', mathScaffold("Number.-", function(x, y) { return x - y; }));
      def('Number *', mathScaffold("Number.*", function(x, y) { return x * y; }));
      def('Number /', mathScaffold("Number./", function(x, y) { return y === 0 ? null : x / y; }));
      def('Number <', mathScaffold("Number.<", function(x, y) { return x < y; }));
      def('Number >', mathScaffold("Number.>", function(x, y) { return x > y; }));
      def('Number tos', function(call) { return toIotaFormat(get(call, 'target') == get('Number') ? "Number" : raw(call, 'target')); });

      def('Function tos', function() { return toIotaFormat("FUNCTION"); });
      def('Function protos', iotaArrayCreate(get("Object")));

      def('Nil protos', iotaArrayCreate(get("Object")));
      def('Nil tos', function() { return toIotaFormat("nil"); });

      def('True protos', iotaArrayCreate(get("Object")));
      def('True tos', function() { return toIotaFormat("true"); });

      def('False protos', iotaArrayCreate(get("Object")));
      def('False tos', function() { return toIotaFormat("false"); });

      def('String protos', iotaArrayCreate(get("Object")));
      def('String tos', function(call) { return toIotaFormat(raw(call, 'target')); });
      def('String toArray', function(call) { return toIotaFormat(stringToCharCodes(raw(call, 'target'))); });
      def('String parse', function(call) {
        try {
          var msgs = [];
          var failed = false;
          var cfg = {
            callback: function(m) {
              msgs = msgs.concat(m);
            },
            error: function() {
              failed = true;
            }
          };
          iota.parse(iota.tokenize(raw(call, 'target'), cfg), cfg);

          if (failed) {
            return toIotaFormat(null);
          }

          msgs = toIotaFormat(msgs);
          retypeArgument(msgs);
          return msgs;
        } catch (ex) {
          return toIotaFormat(null);
        }
      });
      def('String fromArray', function(call) {
        return toIotaFormat(String.fromCharCode.apply(null, raw(evalExpression(raw(call, 'message arguments')[0], get(call, 'sender'))).map(function(e) {
          return raw(e);
        })));
      });

      def('Message protos', iotaArrayCreate(get("Object")));
      def('Message tos', function(call) {
        var msgToStr = function(msg) {
          var str = raw(msg, 'value');
          if (raw(msg, 'arguments').length > 0) {
            str += "(";
            str += raw(msg, 'arguments').map(function(x) {
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
        return toIotaFormat(msgToStr(get(call, 'target')));
      });

      def('if', function(call) {
        var len = raw(call, 'message arguments').length;
        var x = raw(call, 'message arguments')[0];
        var y = raw(call, 'message arguments')[1];
        var z = raw(call, 'message arguments')[2];

        if (!isFalsy(evalExpression(x, get(call, 'sender')))) {
          return evalExpression(y, get(call, 'sender'));
        } else if (len > 2) {
          return evalExpression(z, get(call, 'sender'));
        }
      });
      def('while', function(call) {
        var condition = raw(call, 'message arguments')[0];
        var expression = raw(call, 'message arguments')[1];

        var result = toIotaFormat(null);
        while (!isFalsy(evalExpression(condition, get(call, 'sender')))) {
          result = evalExpression(expression, get(call, 'sender'));
        }
        return result;
      });
      def('new', function() { return { type: 'new', keys: {} }; });
      def('true', function() { return toIotaFormat(true); });
      def('false', function() { return toIotaFormat(false); });
      def('nil', function() { return toIotaFormat(null); });
      def('func', function(origin) {
        return set(toIotaFormat(function(call) {
          return evalExpression(raw(call, 'callee origin message arguments')[0], {
            type: "locals",
            keys: {
              protos: iotaArrayCreate(
                get(call, 'target'),
                get(call, 'callee origin sender')
              ),
              call: call
            }
          });
        }), 'origin', origin);
      });
      def('println', function(call) {
        var x = raw(call, 'message arguments')[0];
        var e = evalExpression(x, get(call, 'sender'));
        var f = findMethod("tos", e, raw(call, "message line"), raw(call, "message column"));
        var after = activateIotaField(f, e, get(call, 'sender'), toIotaFormat({
          type: 'symbol',
          value: "tos",
          line: -106,
          column: -106,
          'arguments': []
        }));
        var line = x.value.map(function(e) { return e.value; })[0][0].keys.line.value;
        config.println(after.value, line);
      });
      def('protos', iotaArrayCreate(get("Object")));

      config = config || {};
      config.println = config.println || function(str) {
        console.log(str);
      };
      config.error = config.error || function(str) {
        console.log("error:", str);
        throw str;
      };

      return function(messages) {
        try {
          var m = toIotaFormat(messages);
          retypeArgument(m);
          evalExpression(m, lobby);
        } catch (ex) {
          config.error(ex);
        }
      };
    },
    execute: function(code, config) {
      var interpreter = iota.interpreter(config);
      var tokens = iota.tokenize(code, config);
      iota.parse(tokens, {
        error: config.error,
        callback: function(messages) {
          interpreter(messages);
        }
      });
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = iota;
  }
  return iota;
}());
