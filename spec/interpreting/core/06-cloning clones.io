slot("a", 1 clone)
slot("b", a clone)
println(a protos at(0) protos at(0) same(Number)) #= true
println(b protos at(0) same(a)) #= true
println(b protos at(0) protos at(0) same(Number)) #= false
println(a protos at(0) +(a protos at(0))) #= 2

# println(a +(a)) # What do we really expect here? Should we be able to add these or not?

slot("a", "hello" clone)
slot("b", a clone)
println(a protos at(0) protos at(0) same(String)) #= true
println(b protos at(0) same(a)) #= true
println(b protos at(0) protos at(0) same(String)) #= false
