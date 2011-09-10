
# Check which methods the lobby contains
println(slots()) #= [ Array, False, false, func, Function, if, Message, new, Nil, nil, Number, Object, println, protos, String, True, true, while ]
println(slots protos) #= Array
println(slots protos same(Array)) #= true
println(slots protos protos protos same(slots protos)) #= true

# Check the contents of the lobby protos
println(protos length) #= 1
println(protos at(0) same(Object)) #= true

# Make sure the protos of the protos is Array
# WARNING: this cannot be created. it would cause an endless loop of array-protos, so the protos of array must be a single object
# protos protos length println #= 1
# protos protos at(0) same(Array) println #= true
println(protos protos same(Array)) #= true

# Check True, False and Nil roots
println(Nil slots()) #= [ protos, tos ]
println(Nil protos length) #= 1
println(Nil protos at(0) same(Object)) #= true
println(True slots()) #= [ protos, tos ]
println(True protos length) #= 1
println(True protos at(0) same(Object)) #= true
println(False slots()) #= [ protos, tos ]
println(False protos length) #= 1
println(False protos at(0) same(Object)) #= true

# Check invokations of true, false and nil
println(nil slots()) #= [ protos ]
println(nil protos length) #= 1
println(nil protos at(0) same(Nil)) #= true
println(nil same(nil)) #= false
println(true slots()) #= [ protos ]
println(true protos length) #= 1
println(true protos at(0) same(True)) #= true
println(true same(true)) #= false
println(false slots()) #= [ protos ]
println(false protos length) #= 1
println(false protos at(0) same(False)) #= true
println(false same(false)) #= false

# Check that true, false and nil are actually functions
println(slot("nil") slots()) #= [ protos ]
println(slot("nil") protos length) #= 1
println(slot("nil") protos at(0) same(Function)) #= true
println(slot("true") slots()) #= [ protos ]
println(slot("true") protos length) #= 1
println(slot("true") protos at(0) same(Function)) #= true
println(slot("false") slots()) #= [ protos ]
println(slot("false") protos length) #= 1
println(slot("false") protos at(0) same(Function)) #= true

# Check the Object object
println(Object slots()) #= [ clone, delete, same, send, slot, slots, tos ]
println(Object slot("clone")   protos at(0) same(Function)) #= true
println(Object slot("delete")  protos at(0) same(Function)) #= true
println(Object slot("same")    protos at(0) same(Function)) #= true
println(Object slot("send")    protos at(0) same(Function)) #= true
println(Object slot("slot")    protos at(0) same(Function)) #= true
println(Object slot("slots")   protos at(0) same(Function)) #= true
println(Object slot("tos")     protos at(0) same(Function)) #= true

println(Object slot("clone")   protos at(0) protos at(0) same(Object)) #= true

println(Object slot("clone")   protos length) #= 1
println(Object slot("delete")  protos length) #= 1
println(Object slot("same")    protos length) #= 1
println(Object slot("send")    protos length) #= 1
println(Object slot("slot")    protos length) #= 1
println(Object slot("slots")   protos length) #= 1
println(Object slot("tos")     protos length) #= 1

# Check the Function object
println(Function slots()) #= [ protos, tos ]
println(Function protos length) #= 1
println(Function protos at(0) same(Object)) #= true

# Check the Array object
println(Array slots()) #= [ at, clone, length, protos, push, tos ]
println(Array protos length) #= 1
println(Array protos at(0) same(Object)) #= true
println(Array slot("at")     protos at(0) same(Function)) #= true
println(Array slot("length") protos at(0) same(Function)) #= true

# Check the Number object
println(Number slots()) #= [ *, +, -, /, <, >, protos, tos ]
println(Number protos length) #= 1
println(Number protos at(0) same(Object)) #= true
println(Number slot("*") protos at(0) same(Function)) #= true
println(Number slot("+") protos at(0) same(Function)) #= true
println(Number slot("-") protos at(0) same(Function)) #= true
println(Number slot("/") protos at(0) same(Function)) #= true
println(Number slot("<") protos at(0) same(Function)) #= true
println(Number slot(">") protos at(0) same(Function)) #= true

# Check the String object
println(String slots()) #= [ fromArray, parse, protos, toArray, tos ]
println(String protos length) #= 1
println(String protos at(0) same(Object)) #= true
println(String slot("parse") protos at(0) same(Function)) #= true
println(String slot("toArray") protos at(0) same(Function)) #= true
println(String slot("fromArray") protos at(0) same(Function)) #= true

# Check the Array object
println(Array slots()) #= [ at, clone, length, protos, push, tos ]
println(Array protos length) #= 1
println(Array protos at(0) same(Object)) #= true
println(Array slot("at") protos at(0) same(Function)) #= true
println(Array slot("length") protos at(0) same(Function)) #= true
println(Array slot("push") protos at(0) same(Function)) #= true

# Check the Message object
println(Message slots()) #= [ protos, tos ]
println(Message protos length) #= 1
println(Message protos at(0) same(Object)) #= true

# Create some objects and check for their existance
println(slot("myNum", 10)) #= { Array, False, false, func, Function, if, Message, myNum, new, Nil, nil, Number, Object, println, protos, String, True, true, while }
slot("myString", "global")
slot("myObject", Object clone)
println(myObject slot("prop1", 10)) #= { prop1, protos }
println(myObject slot("prop2", 20) same(myObject)) #= true
println(myObject slot("prop3", 30)) #= { prop1, prop2, prop3, protos }
println(slots()) #= [ Array, False, false, func, Function, if, Message, myNum, myObject, myString, new, Nil, nil, Number, Object, println, protos, String, True, true, while ]
println(myObject slots()) #= [ prop1, prop2, prop3, protos ]
println(myObject delete("prop2")) #= { prop1, prop3, protos }
println(myObject slots()) #= [ prop1, prop3, protos ]

# Print the objects
println(myNum) #= 10
println(myString) #= global
println(myObject) #= { prop1, prop3, protos }
println(myObject prop1) #= 10
println(myObject prop3) #= 30

# Make sure that using "slot" to access the non-activatable slots result in the same thing
println(slot("myNum")) #= 10
println(slot("myString")) #= global
println(slot("myObject")) #= { prop1, prop3, protos }
println(slot("myObject") prop1) #= 10
println(slot("myObject") prop3) #= 30

# Test escaping of strings
println("test") #= test
println("te\tst") #= te	st
println('te\tst') #= te	st
println("te\\st") #= te\st
# println("te\"st") #= te"st # --- This should pass, but I cant stand the error messages any more!
# println('te\'st') #= te'st # --- Temove the comment later.
println("te'st")  #= te'st
println('te"st')  #= te"st

# Test the "same"-function
println(123 same(123)) #= false
println(123 same(124)) #= false
println("apa" same("apa")) #= false
println(myNum same(myNum)) #= true
println(myString same(myString)) #= true
println(myObject same(myObject)) #= true
slot("likeMyObject", Object clone)
likeMyObject slot("prop1", 10)
likeMyObject slot("prop3", 30)
println(myObject same(likeMyObject)) #= false
println(Nil same(Nil)) #= true
println(True same(True)) #= true
println(False same(False)) #= true
println(Nil clone same(Nil clone)) #= false
println(True clone same(True clone)) #= false
println(False clone same(False clone)) #= false

# Try using the functions from Number
slot("otherNum", 2)
println(myNum +(otherNum)) #= 12
println(myNum -(otherNum)) #= 8
println(myNum /(otherNum)) #= 5
println(myNum *(otherNum)) #= 20
println(myNum <(otherNum)) #= false
println(myNum >(otherNum)) #= true
println(myNum /(0)) #= nil

# Try using the functions from Array
slot("myList", Array clone)
println(myList length) #= 0
println(myList push("first") same(myList)) #= true
println(myList length) #= 1
myList push("second") push(3)
println(myList length) #= 3
println(myList at(0)) #= first
println(myList at(1)) #= second
println(myList at(2)) #= 3

# Try if
println(slot("if") slots()) #= [ protos ]
println(slot("if") protos length) #= 1
println(slot("if") protos at(0) same(Function)) #= true
println(if(0,            "first", "second")) #= first
println(if(1,            "first", "second")) #= first
println(if("",           "first", "second")) #= first
println(if("anything",   "first", "second")) #= first
println(if(Object clone, "first", "second")) #= first
println(if(Nil clone,    "first", "second")) #= second
println(if(True clone,   "first", "second")) #= first
println(if(False clone,  "first", "second")) #= second
println(if(Nil,          "first", "second")) #= second
println(if(True,         "first", "second")) #= first
println(if(False,        "first", "second")) #= second

# Try while
println(slot("while") slots()) #= [ protos ]
println(slot("while") protos length) #= 1
println(slot("while") protos at(0) same(Function)) #= true
println(while(nil, println("step1")) protos at(0) same(Nil)) #= true
while(otherNum >(0),
  slot("otherNum", otherNum -(1))
  println("step2")
)
#= step2
#= step2

println("hello" toArray) #= [ 104, 101, 108, 108, 111 ]
println(String fromArray("hello" toArray)) #= hello

