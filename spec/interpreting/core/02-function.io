## Below are some tests of the very basic predefined data in a program
## They are all related to the func-function
## Tests for the rest of the language can be found in a separate file



slot("lobby", func(
  call sender
))

slot("lobbyInstance", lobby())



slot("f1", func(
  println(call sender same(lobbyInstance))
  println(call target same(lobbyInstance))
  println(call slot("callee") same(call sender slot("f1"))) # Should not have to write "call sender" here
))


f1
#= true
#= true
#= true



# 
# slot("f2", func(
#   call message name println #= f
#   call message arguments protos length println #= 1
#   call message arguments protos at(0) same(Array) println #= true
#   call message arguments length println #= 2
# 
#   call message arguments at(0) protos at(0) same(Array) #= true
#   call message arguments at(0) length #= 1
#   call message arguments at(0) at(0) protos length #= 1
#   call message arguments at(0) at(0) protos at(0) same(Message) #= true
# 
#   call message arguments at(1) protos at(0) same(Array) #= true
#   call message arguments at(1) length #= 1
#   call message arguments at(1) at(0) protos length #= 1
#   call message arguments at(1) at(0) protos at(0) same(Message) #= true
# 
#   # testa innehållen i de skickade meddelandena
# 
#   call sender same(lobbyInstance) println #= true
#   call target same(something) println #= true
#   call callee same(getSlot("f2")) println #= true
#   call callee same(something getSlot("f")) println #= true
# ))
# slot("something", new)
# something slot("f", getSlot("f2"))
# something f(10, 20)
