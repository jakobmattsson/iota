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

Objects are in-memory representations of the current state of a program. Some exist before the execution of code begins and some are created (or changed or destroyed) as messages are being passed. Even messages themselves are objects that can be accessed while an iota program is executed.

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
* **println**

**objects**

* **Object**: ...
* **Number**: ...
* **String**: ...
* **False**: ...
* **Nil**: ...
* **True**: ...
* **Array**: ...
* **Function**: ...
* **Message**: ...

It also contains **protos** ... explain ...


License
-------

to be decided
