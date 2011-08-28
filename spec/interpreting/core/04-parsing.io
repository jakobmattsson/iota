slot("p", "a12 +(45)" parse)
slot("q", "(((" parse)
slot("z", "" parse)

println(z length) #= 0

println(q) #= nil
println(q protos at(0) same(Nil)) #= true

println(p length) #= 1
println(p at(0) length) #= 2

println(p at(0) at(0) slots()) #= [ arguments, column, comment, line, name, protos, value ]
println(p at(0) at(0) protos length) #= 1
println(p at(0) at(0) protos at(0) same(Message)) #= true
println(p at(0) at(0) name) #= a12
println(p at(0) at(0) value) #= nil
println(p at(0) at(0) comment) #= nil
println(p at(0) at(0) line) #= 1
println(p at(0) at(0) column) #= 1
println(p at(0) at(0) arguments length) #= 0

println(p at(0) at(1) slots()) #= [ arguments, column, comment, line, name, protos, value ]
println(p at(0) at(1) protos length) #= 1
println(p at(0) at(1) protos at(0) same(Message)) #= true
println(p at(0) at(1) name) #= +
println(p at(0) at(1) value) #= nil
println(p at(0) at(1) comment) #= nil
println(p at(0) at(1) line) #= 1
println(p at(0) at(1) column) #= 5
println(p at(0) at(1) arguments length) #= 1

println(p at(0) at(1) arguments at(0) length) #= 1
println(p at(0) at(1) arguments at(0) at(0) length) #= 1
println(p at(0) at(1) arguments at(0) at(0) at(0) slots()) #= [ arguments, column, comment, line, name, protos, value ]
println(p at(0) at(1) arguments at(0) at(0) at(0) protos length) #= 1
println(p at(0) at(1) arguments at(0) at(0) at(0) protos at(0) same(Message)) #= true
println(p at(0) at(1) arguments at(0) at(0) at(0) name) #= nil
println(p at(0) at(1) arguments at(0) at(0) at(0) value) #= 45
println(p at(0) at(1) arguments at(0) at(0) at(0) comment) #= nil
println(p at(0) at(1) arguments at(0) at(0) at(0) line) #= 1
println(p at(0) at(1) arguments at(0) at(0) at(0) column) #= 7
println(p at(0) at(1) arguments at(0) at(0) at(0) arguments length) #= 0

# println(5 send(p at(0) at(1))) #= 50 # not yet implemented


