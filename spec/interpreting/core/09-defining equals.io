Object slot("=", func(
  slot("value", call target)
  slot("variableName", call message arguments at(0) at(0) at(0) tos()) # this could be done in a more safe way
  call sender slot(variableName, value)
  value
))

slot("a", 10)

1 =(a)
2 =(b)

println(a) #= 1
println(b) #= 2
