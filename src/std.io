# This file contains concepts referenced to by the compiler itself.
# It also contains some functions that are absolutely essential.
# It could be said that this is part of the compiler, but on the other hand it can all be implemented in moldlang itself.


# All of this is work in progress! Run at your own risk.


slot("true", func(slot("true") clone))
slot("false", func(slot("false") clone))
slot("nil", func(slot("nil") clone))

slot("while", func(
  slot("predicate", call message arguments at(0))
  slot("expression", call message arguments at(1))
  if(call sender send(predicate),
    call sender send(expression)
    while(predicate, expression),
    nil
  )
))

Object slot("clone", func(
  slot("x", new)
  x slot("protos", self)
  if(self slot("missing"),
    x slot("missing", self slot("missing"))
  )
  x
))

Object   slot("protos", Array clone)
Number   slot("protos", Array clone push(Object))
String   slot("protos", Array clone push(Object))
Array    slot("protos", Array clone push(Object))
Function slot("protos", Array clone push(Object))
Message  slot("protos", Array clone push(Object))
