var fs = require('fs');
var iota = require('./src/iota');
var async = require('async');
var _ = require('underscore');

desc('Run the tests');
task('spec', function() {

  var testParser = function(complete) {
    fs.readdir('spec/parsing/input', function(err, files) {
      async.map(files, function(file, callback) {
        fs.readFile('spec/parsing/input/' + file, 'utf-8', function(err, input) {
          if (err) {
            callback(err);
            return;
          }
          var parts = file.split('-');
          fs.readFile('spec/parsing/output/' + parts[0] + '.js', 'utf-8', function(err, expected) {
            if (err) {
              callback(err)
              return;
            }
            callback(err, {
              id: parts[0],
              name: parts[1].match(/^(.*)\.io$/)[1],
              content: input,
              expected: expected
            });
          });
        });
      }, function(err, list) {
        if (err) {
          complete(err);
          return;
        }
        complete(null, list.map(function(item) {
          var tokens = iota.tokenize(item.content);
          var messages = [];
          iota.parse(tokens, {
            disableOperators: true,
            callback: function(msgs) {
              messages = messages.concat(msgs);
            }
          });
          var specData = eval(item.expected);
          var msgs = eval(JSON.stringify(messages));

          if (_.isEqual(specData, msgs)) {
            return { name: "Parsing " + item.id + ": " + item.name, msg: null };
          } else {
            return { 
              name: "Parsing " + item.id + ": " + item.name, 
              msg: [
                "Expected:",
                "  " + JSON.stringify(specData),
                "Got:",
                "  " + JSON.stringify(msgs)
                ].join('\n')
            };
          }
        }));
      });
    });
  };

  var testInterpreter = function(complete) {
    fs.readdir('spec/interpreting/core', function(err, files) {
      async.map(files, function(item, callback) {
        fs.readFile('spec/interpreting/core/' + item, 'utf8', function(err, data) {
          if (err) {
            callback(err);
            return;
          }
          callback(err, {
            filename: item,
            content: data
          });
        });
      }, function(err, list) {
        if (err) {
          complete(err);
          return;
        }

        var res = [];

        list.forEach(function(file) {
          var errors = 0;
          var tokens = iota.tokenize(file.content);
          var expected = [];

          var inter = iota.interpreter({
            println: function(x, line) {
              var next = expected.shift();
              if (x != next) {
                res.push({
                  name: file.filename + ", line " + line,
                  msg: ["Expected:", "  " + next, "Got:", "  " + x].join('\n')
                });
              } else {
                res.push({ name: file.filename + ", line " + line, msg: null });
              }
            }
          })

          iota.parse(tokens, {
            disableOperators: true,
            callback: function(messages) {
              expected = expected.concat(messages.map(function(msgLine) {
                return msgLine.filter(function(msg) {
                  return msg.type == "comment" && msg.value[0] == "=";
                }).map(function(msg) {
                  return msg.value.slice(1).trim();
                });
              }).filter(function(comments) {
                return comments.length > 0;
              }).map(function(comments) {
                return comments[0];
              }));
            }
          });

          iota.parse(tokens, {
            disableOperators: true,
            callback: function(messages) {
              try {
                inter(messages);
              } catch (ex) {
                res.push({ name: file.filename, msg: "Exception raised: " + ex });
              }
            }
          });

          if (expected.length > 0) {
            res.push({ name: file.filename, msg: "Never got the following: " + expected.join('\n  ') });
          }

        });

        complete(null, res);
      });
    });
  };

  var testInterpreterErrors = function(complete) {
    fs.readdir('spec/interpreting/errors', function(err, files) {
      async.map(files, function(item, callback) {
        fs.readFile('spec/interpreting/errors/' + item, 'utf8', function(err, data) {
          if (err) {
            callback(err);
            return;
          }
          callback(err, {
            filename: item,
            content: data
          });
        });
      }, function(err, list) {
        if (err) {
          complete(err);
          return;
        }

        var res = [];

        list.map(function(file) {
          var tokens = iota.tokenize(file.content);
          var messages = [];
          
          
          iota.parse(tokens, {
            disableOperators: true,
            callback: function(msgs) {
              messages = messages.concat(msgs);
            }
          });
          
          var gotError = false;

          var expected = messages.map(function(msgLine) {
            return msgLine.filter(function(msg) {
              return msg.type == "comment" && msg.value[0] == "=";
            }).map(function(msg) {
              return msg.value.slice(1).trim();
            });
          }).filter(function(comments) {
            return comments.length > 0;
          }).map(function(comments) {
            return comments[0];
          }).join("");

          try {
            var inter = iota.interpreter({
              error: function(msg) {
                gotError = true;
                if (msg != expected) {
                  res.push({
                    name: file.filename,
                    msg: [
                      "Exception caught, expected:",
                      "  " + expected,
                      "Got:",
                      "  " + msg
                    ].join("\n")
                  });
                } else {
                  res.push({ name: file.filename, msg: null });
                }
              }
            });
            inter(messages);
          } catch (ex) {
            res.push({ name: file.filename, msg: "Exception raised: " + ex });
          }

          if (!gotError) {
            res.push({ name: file.filename, msg: "Never got an exception" });
          }
        });

        complete(null, res);
      });
    });
  };

  var testParserErrors = function(complete) {
    fs.readdir('spec/parsing/errors', function(err, files) {
      async.map(files, function(item, callback) {
        fs.readFile('spec/parsing/errors/' + item, 'utf8', function(err, data) {
          if (err) {
            callback(err);
            return;
          }
          callback(err, {
            filename: item,
            content: data
          });
        });
      }, function(err, list) {
        if (err) {
          complete(err);
          return;
        }

        var res = [];

        list.map(function(file) {

          var expected = file.content.split("\n")[0].slice(3);
          var gotError = false;
          var err = function(msg) {
            gotError = true;
            if (msg != expected) {
              res.push({
                name: file.filename,
                msg: [
                  "Exception caught, expected:",
                  "  " + expected,
                  "Got:",
                  "  " + msg
                ].join("\n")
              });
            } else {
              res.push({ name: file.filename, msg: null });
            }
          };

          try {
            var tokens = iota.tokenize(file.content, { error: err });
            if (!gotError) {
              iota.parse(tokens, {
                disableOperators: true,
                error: err
              })
            }
          } catch (ex) {
            res.push({ name: file.filename, msg: "Exception raised: " + ex });
          }

          if (!gotError) {
            res.push({ name: file.filename, msg: "Never got an exception" });
          }
        });

        complete(null, res);
      });
    });
  };

  var testOperators = function(complete) {
    var stringToMessages = function(data, disableOps) {
      var tokens = iota.tokenize(data);
      var messages = [];
      iota.parse(tokens, {
        disableOperators: disableOps,
        callback: function(msgs) {
          messages = messages.concat(msgs);
        }
      });
      return messages;
    };
    fs.readdir('spec/operators/input', function(err, files) {
      async.map(files, function(file, callback) {
        fs.readFile('spec/operators/input/' + file, 'utf-8', function(err, input) {
          if (err) {
            callback(err);
            return;
          }
          fs.readFile('spec/operators/output/' + file, 'utf-8', function(err, expected) {
            if (err) {
              fs.readFile('spec/operators/output/' + file.replace(".io", ".js"), 'utf-8', function(err, expected) {
                if (err) {
                  callback(err);
                  return;
                }
                callback(err, {
                  js: true,
                  name: file.replace(".io", ".js"),
                  content: input,
                  expected: expected
                });
              });
            } else {
              callback(err, {
                name: file,
                content: input,
                expected: expected
              });
            }
          });
        });
      }, function(err, list) {
        if (err) {
          complete(err);
          return;
        }
        complete(null, list.map(function(item) {
          var exMessages = item.js ? JSON.parse(item.expected) : stringToMessages(item.expected, true);
          var outMessages = stringToMessages(item.content);

          if (_.isEqual(exMessages, outMessages)) {
            return { name: "Parsing operators: " + item.name, msg: null };
          } else {
            return { 
              name: "Parsing operators: " + item.name, 
              msg: [
                "Expected:",
                "  " + JSON.stringify(exMessages),
                "Got:",
                "  " + JSON.stringify(outMessages)
                ].join('\n')
            };
          }
        }));
      });
    });
  };

  async.series([testParser, testInterpreter, testInterpreterErrors, testParserErrors, testOperators], function(err, results) {
    var flatResults = _.flatten(results);

    var tests = flatResults.reduce(function(acc, item) {
      acc[item.name] = acc[item.name] || !!item.msg;
      return acc;
    }, {});
    console.log("TESTS");
    console.log("======================================================================");
    Object.keys(tests).forEach(function(test) {
      console.log(tests[test] ? "FAILED" : "OK    ", test);
    });
    console.log();
    console.log();
    console.log();

    var errors = flatResults.filter(function(x) { return x.msg; });
    if (errors.length > 0) {
      console.log("ERRORS");
      console.log("======================================================================");
      errors.forEach(function(error) {
        console.log(error.name);
        console.log(error.msg);
        console.log("======================================================================");
      });
      console.log();
      console.log();
      console.log();
    }

    console.log("SUMMARY");
    console.log("======================================================================");
    console.log("OK:", flatResults.length - errors.length, "FAILED:", errors.length);
  });
});
