slot("lobby", func(
 call sender
))

println(slot("lobby") origin message arguments) #= [ [ [ call, sender ] ] ]

slot("lobby2", func(
 call slot("callee") origin sender
))

slot("lobbyInstance", lobby)

println(slot("lobby") slots()) #= [ origin, protos ]

println(lobby same(lobby)) #= true

slot("f1", func(
  println(call)
  println(call sender same(lobbyInstance))
  println(call target same(lobbyInstance))
  println(call sender same(lobby2))
  println(call target same(lobby))
  println(call slot("callee") same(slot("f1")))
  println(call message)
  println(call message arguments length)
))
f1
#= { callee, message, protos, sender, target }
#= true
#= true
#= true
#= false
#= true
#= f1
#= 0

println(slot("f1") origin) #= { callee, message, protos, sender, target }
println(slot("f1") origin slot("callee") same(slot("func"))) #= true
println(slot("f1") origin message arguments length) #= 1
println(slot("f1") origin message arguments at(0) length) #= 8

slot("unused", func(a b; c(d, e) f, g h(i)))
println(slot("unused") origin message) #= func(a b; c(d, e) f, g h(i))
