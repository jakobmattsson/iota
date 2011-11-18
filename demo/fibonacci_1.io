slot("a", 1)
slot("b", 1)
slot("counter", 20)

println(a)
println(b)

while(counter > 0, 
  slot("next", a + b)
  println(next)

  slot("a", b)
  slot("b", next)
  slot("counter", counter - 1)
)
