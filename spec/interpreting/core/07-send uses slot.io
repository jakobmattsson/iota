# create the message "m", adding the number 8 to its target
slot("m", "+(8)" parse at(0) at(0))

# try the message by sending it to a 4
println(4 send(m)) #= 12

# now override slot by simply returning 99
#Array slot("slot", func(99))

# Make sure the descendants of Object got the change as well
#println(Array slot()) #= 99

# Now send the message m to 4 again; it should be using slot behind the scenes
#println(4 send(m)) #= 99



# Make sure regular message interpretation used "send" behind the scenes
Number slot("send", func(42))
println(5 +(10)) #= 42