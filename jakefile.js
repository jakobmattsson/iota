var fs = require('fs');
var iota = require('./src/iota');
var async = require('async');
var _ = require('underscore');

namespace('spec', function() {
  desc('Run the parser tests');
  task('parser', [], function() {
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
          console.log("Test error:", err);
          return;
        }
        var failures = 0;
        list.forEach(function(item) {
          var tokens = iota.tokenize(item.content);
          var messages = iota.parse(tokens);
          var specData = eval(item.expected);
          var msgs = eval(JSON.stringify(messages));

          if (_.isEqual(specData, msgs)) {
            console.log(item.id, item.name, "OK");
          } else {
            failures++;
            console.log(item.id, item.name, "FAILED");
          }
        });
        if (failures > 0) {
          console.log("Total failures: " + failures);
        }
      });
    });
  });

  desc('Run the interpreter tests');
  task('interpreter', [], function() {
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
          console.log("Test error:", err);
          return;
        }
        list.map(function(file) {
          var errors = 0;
          var tokens = iota.tokenize(file.content);
          var messages = iota.parse(tokens);

          var expected = messages.map(function(msgLine) {
            return msgLine.filter(function(msg) {
              return msg.comment && msg.comment[0] == "=";
            }).map(function(msg) {
              return msg.comment.slice(1).trim();
            });
          }).filter(function(comments) {
            return comments.length > 0;
          }).map(function(comments) {
            return comments[0];
          });

          try {
            console.log("Executing " + file.filename + "...");
            iota.evaluate(messages, {
              println: function(x, line) {
                var next = expected.shift();
                if (x != next) {
                  errors++;
                  console.log("Line " + line + "; expected:");
                  console.log("  ", next);
                  console.log("Got:");
                  console.log("  ", x);
                  console.log();
                  console.log();
                } else {
                  console.log("Line " + line + " OK");
                }
              }
            });
            if (expected.length > 0) {
              console.log("Never got the following:");
              expected.forEach(function(x) {
                errors++;
                console.log("  " + x);
              });
              console.log();
            }
          } catch (ex) {
            console.log("Exception raised!");
            errors++;
          }
          return {
            filename: file.filename,
            errors: errors
          };
        }).forEach(function(r) {
          console.log("Total errors in " + r.filename + ": " + r.errors);
        });
      });
    });
  });
});
