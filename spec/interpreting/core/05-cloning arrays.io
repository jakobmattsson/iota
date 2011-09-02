# This test verifies that cloning an array puts that actual array in the protos-list
# instead of the Array object

slot("x", Array clone)
x push(10)
x push(20)
println(x length) #= 2

slot("y", x clone)
println(y length) #= 0
println(y protos length) #= 1
println(y protos at(0) length) #= 2
