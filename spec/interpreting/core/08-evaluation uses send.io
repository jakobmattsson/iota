slot("m", "length" parse at(0) at(0))

# Sending "length" to the array should yield the same value and invoking length directly.
println(Array send(m)) #= 0
println(Array length) #= 0
println(Object slots) #= [ clone, delete, same, send, slot, slots, tos ]

Array slot("send", 123)

# Now send has been altered. Not only invoking "send" should change, but also invoking length directly.
println(Array send(m)) #= 123
println(Array length) #= 123
println(Object slots) #= [ clone, delete, same, send, slot, slots, tos ]
