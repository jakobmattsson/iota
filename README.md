iota
====

What is it?
-----------

A cool language


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

* **if**: Takes two or three arguments. If the first one evaluates to a truthy value, the the second one is evaluated and its result returned. Otherwise the third one is evaluted and its result returned (if there is a third one). If there is not a third one, Nil clone is invoked and returned.
* **while**: Takes two arguments. As long as the first one evaluates to a truthy value, the second one is evaluated. The result of the last evaluation of the second argument is returned when the function terminates. If the first argument never evaluated to a truthy value, Nil clone is invoked and returned.
* **new**: Creates and returns a new object without any slots whatsoever.
* **true**: Takes no arguments. When invoked, clones True and returns the result. [Note: should be removed from the core]
* **false**: Takes no arguments. When invoked, clones False and returns the result. [Note: should be removed from the core]
* **nil**: Takes no arguments. When invoked, clones Nil and returns the result. [Note: should be removed from the core]
* **func**: Described later
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

It also contains **protos** ... explain ...

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
* **protos**:
* **toArray**:   Function that returns an array of numbers from the string
* **tos**:

### Array

* **at**:     Function that takes a number as its argument and return the array index at that index, starting from zero. Returns "Nil clone" if the argument is out of range.
* **clone**:
* **length**: Function that return the number of items in the array.
* **protos**:
* **push**:
* **tos**:

### Function

* **protos**:
* **tos**:

### Message

* **name**:      String representing the name of the message. "Nil clone" if the message is a literal value or a comment. The message "\n" is reserved for actual newlines.
* **value**:     A string or a number if the message is a literal value. "Nil clone" if it is a symbolic message or a comment.
* **comment**:   The comment string, if this message is a comment. "Nil clone" if it is a symbolic message or a literal value.
* **arguments**: Array of arguments belonging to the message. Every element is an array of messages.
* **line**:      Number representing the line of the source file where the message started.
* **column**:    Number representing the column of the source file where the message started.
* **file**:      String representing the name of the source file where the message was defined.


Notes
-----
* If a function is cloned, the new object will not be a function itself. It will just have the function as a proto.
* The paraenthesis are optional when invoking a function. Simply stating the name of it will invoke it.
* Use slot("name_of_function") to get a reference to a function without invoking it.
* The protos-slot can be a single object or an array. If it is a single object, that single object is the prototype. If it is an array, every object in that array serve as prototypes. (The reason for this is that cloning an array would cause an infinite loop if the clone required a new array for the protos slot).
* An object is considered falsy if Nil or False is can be found among its ancestors (note: note just its parents)
* All objects that are not falsy are considered truthy


ToDo
----
1. Implement the parse-method (and proper message objects)
2. Tests for accessing undefined slots
3. Method missing
4. User-defined functions
5. Tail recursion
6. Operators
7. JavaScript interoperability
8. Exceptions (maybe)


License
-------

to be decided
