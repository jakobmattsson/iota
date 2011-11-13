iota
====

What is it?
-----------
A small but powerful programming language claiming to be the most dynamic one so far.

It was inspired by Lisp, JavaScript, Ruby and most notably Io.

It is:

* Prototype-based
* Object-oriented
* Lazily evaluated
* Message centric
* RPEPL-processed

The reference implementation produces lint-free JavaScript ready
to run in your browser or any other JavaScript environment.


Why is it?
----------
Because if you gaze into the abyss the abyss gazes into you.

There are problems for which creating an entire new language is actually
a reasonable solution. Now, imagine a language powerful enough to put an
end to that kind of resort and you've understood the goal of iota.

I wanted to see if this could be done and decided to conceive a language where:

  1. Everything was as dynamic as possible.
  2. The number of primitives was kept to a minimum.
  3. Performance was not an issue. At all.


You want to avoid creating new languages?
-----------------------------------------
It's not about stoping development of new languages, quite the opposite! It's about being
able to solve your problems by shaping iota into what you need it to be, rather than
having to create something completely new. Most of what you'd have to write a preprocessor
or compiler for can now be done within iota. In the end there will always be new languages
and new features, but iota will allow them to be prototyped faster and required less often.

Even though this makes sense on some level, creating a language in order to not have to
create languages might seem like a strange thing to do. It surely means gazing into the
abyss of languages-as-a-solution and having abyss gaze back into you. Fortunately, that
is exactly what we need.  When you begin to know something that is fundamentally different
from yourself, you take a piece of it with you and it changes you and vice versa.


So what can it do?
------------------
Mind-blowing example coming soon...


Guide
-----

### Programs and messages

A *program* is a sequence of messages.

A *message* is one of

* string (like *"foo"* or *'bar'*)
* number (like *42* or *3.14*)
* symbol (like *hello* or *+*)
* comment (like *#text*)

It also has any number of arguments from 0 and up. An argument is no more than a sequence of messages of its own.

Every message has an implicit or explicit *target* - an object that it is being sent to.

### Objects

Objects are representations of the current state of a program. Some exist before the execution of code begins and some are created (or changed or destroyed) as messages are being passed. Even messages themselves are objects that can be accessed while an iota program is executed.

### Functions

A *function* is an object that not only represents state, but represents a piece of logic that can be executed when desired. A function is executed (or *called* or *invoked*) when a symbolic message with the same name as the function is passed to the object containing the function.

### The global object

The global object is the target for the first message in every program. It contains some of the fundamental objects of the language:

**functions**

* **if**: Takes two or three arguments. If the first one evaluates to a truthy value, then the second one is evaluated and its result returned. Otherwise the third one is evaluted and its result returned (if there is a third one). If there is not a third one, Nil clone is invoked and returned.
* **while**: Takes two arguments. As long as the first one evaluates to a truthy value, the second one is evaluated. The result of the last evaluation of the second argument is returned when the function terminates. If the first argument never evaluated to a truthy value, Nil clone is invoked and returned.
* **new**: Creates and returns a new object without any slots whatsoever.
* **true**: Takes no arguments. When invoked, clones True and returns the result. (Note: should be removed from the core)
* **false**: Takes no arguments. When invoked, clones False and returns the result. (Note: should be removed from the core)
* **nil**: Takes no arguments. When invoked, clones Nil and returns the result. (Note: should be removed from the core)
* **func**: Takes one argument. Creates a new function using the single argument as body and returns the new function. Read more about creating functions further down.
* **println**: Takes one argument. Runs *tos* on the argument and then prints it to standard out.

**objects**

* **Object**: Used as protos for the remaining eight objects in this list.
* **Number**: Used as protos for numbers.
* **String**: Used as protos for strings.
* **Array**: Used as protos for array objects.
* **Function**: Used as protos for functions.
* **Message**: Used as protos for messages.
* **True**: Used as protos for objects representing false.
* **False**: Used as protos for objects representing truth.
* **Nil**: Used as protos for objects representing nothingness.

It also contains a property called **protos**. Documentation on that coming up soon...

### Object

* **clone**:   Function that takes no arguments and returns a new object with its protos slot set to the target of the clone invokation.
* **delete**:  Function that takes a single string as argument. Removes the slot by that name, if such a slot exists. Returns the object itself.
* **same**:    Function that takes a single object as argument. Returns "True clone" if the argument and the target are the SAME object. Otherwise it returns "False clone"
* **send**:    Function that takes a single message as argument. Passes that message to the target object and returns the result. If the target object is unable to respond to the message, it is instead passed as an argument to the function "missing" of the target, if the target has such a method. If not, "Nil clone" is returned.
* **slot**:    Function that takes either a single string OR a string and an object as arguments. If given a single string, it returns the slot by that name (without calling it, if it is a function). If there is no slot by that name, it returns "Nil clone". If given a string and an object, it sets the slot with the name of the string to the value of the object. Then it returns the target object itself.
* **slots**:   Function that takes no arguments and returns an array of all the names of the slots on this object.
* **tos**:     Function that takes no arguments and returns a string containing the names of all the slots in the target object.

### Number

* __*__:      Function taking a single number as argument. Multiplies the argument with the target and returns a new number respresenting the resulting value. There are no overflows.
* **+**:      Function taking a single number as argument. Adds the argument with the target and returns a new number respresenting the resulting value. There are no overflows.
* **-**:      Function taking a single number as argument. Subtracts the argument from the target and returns a new number respresenting the resulting value. There are no overflows.
* **/**:      Function taking a single number as argument. Divides the target with the arguments and returns a new number respresenting the resulting value. There are no overflows. If the argument is 0, *Nil clone* is returned.
* **<**:      Function taking a single number as argument. Returns *True clone* if the target number is smaller than the argument. Returns *False clone* otherwise.
* **>**:      Function taking a single number as argument. Returns *True clone* if the target number is larger than the argument. Returns *False clone* otherwise.
* **protos**: An array containing *Object* as it single element.
* **tos**:    Function taking no arguments and returning a string representing the target number.

### String

* **fromArray**: Function that creates a string from an array of numbers
* **parse**:     Function that parses a string to an array of messages.
* **protos**:    An array containing *Object* as it single element.
* **toArray**:   Function that returns an array of numbers from the string
* **tos**:       Function taking no arguments and returning a copy of the string itself.

### Array

* **at**:     Function that takes a number as its argument and return the array index at that index, starting from zero. Returns "Nil clone" if the argument is out of range.
* **clone**:  Function that takes no arguments and returns a new object with its protos slot set to the target of the clone invokation.
* **length**: Function that return the number of items in the array.
* **protos**: The object *Object*.
* **push**:   Function that takes a single object as argument. Appends that object to the end of the array.
* **tos**:    Function taking no arguments and returning a string representing the target array.

### Message

* **name**:      String representing the name of the message. "Nil clone" if the message is a literal value or a comment. The message "\n" is reserved for actual newlines.
* **value**:     A string or a number if the message is a literal value. "Nil clone" if it is a symbolic message or a comment.
* **comment**:   The comment string, if this message is a comment. "Nil clone" if it is a symbolic message or a literal value.
* **arguments**: Array of arguments belonging to the message. Every element is an array of messages.
* **line**:      Number representing the line of the source file where the message started.
* **column**:    Number representing the column of the source file where the message started.
* **file**:      String representing the name of the source file where the message was defined.

### Function

* **protos**: Coming soon...
* **tos**:    Coming soon...

Also, an in-depth description of how function-creation/invocation works will be here soon...


Notes
-----
* If a function is cloned, the new object will not be a function itself. It will just have the function as a proto.
* The paraenthesis are optional when invoking a function. Simply stating the name of it will invoke it.
* Use slot("name_of_function") to get a reference to a function without invoking it.
* The protos-slot can be a single object or an array. If it is a single object, that single object is the prototype. If it is an array, every object in that array serve as prototypes. (The reason for this is that cloning an array would cause an infinite loop if the clone required a new array for the protos slot).
* An object is considered falsy if Nil or False is can be found among its ancestors (note: literally ancestors; not just its parents)
* All objects that are not falsy are considered truthy


What the future holds
---------------------
* Method missing
* Tail recursion
* Exceptions
* Operators as a library
* JavaScript interoperability


Why is it called iota?
----------------------
Because it doesn't force you to an iota.

Also, it hints about the relation to [Io](http://iolanguage.com).


License
-------

(The MIT License)

Copyright © 2011 Jakob Mattsson

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the ‘Software’), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED ‘AS IS’, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
