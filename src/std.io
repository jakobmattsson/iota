# This file contains concepts referenced to by the compiler itself.
# It also contains some functions that are absolutely essential.
# It could be said that this is part of the compiler, but on the other hand it can all be implemented in moldlang itself.


# All of this is work in progress! Run at your own risk.


f = function(a, b, c, d,
  body
  ...
)

f(1+1, 2, 3, 4)


slot("function", func(

  var expectedArgCount = call message arguments length - 1
  var args = call message arguments skipEnd(1) map(x -> x name)
  // gör en kontroll att alla "args" är enskilda symboler. inget mer komplicerat. funkar utan det så länge

  block(


  )

  # returnera en ny funktion som evaluerar sina argument
  func(
    if (call message arguments != expectedArgCount, FAIL)
    sender = call sender
    evaledArguments = call message arguments map(x -> sender evaluate(x))

    // exekvera body-koden här

  )
))