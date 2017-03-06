# Panzer

[![Build Status](https://travis-ci.org/bemson/panzer.png)](https://travis-ci.org/bemson/panzer)

version 0.4.0
by Bemi Faison

A comprehensive node-tree solution, for smart data.\*


## Description

Panzer is a JavaScript utility for defining classes that normalize data into node-trees, then implement hierarchical and/or navigation-based logic. Use Panzer to author classes that codify the intent of, and expose relationships in, structured data.

Below is a trivial example, using Panzer to render nested ULs.

```js
var
  ULMaker = Panzer.create(),
  makerPkg = ULMaker.pkg('maker');

makerPkg.badKey = function (name, value) {
  return typeof value !== 'string' || typeof value !== 'object';
};


```

__\*__ Read _[The Cathedral and the Bazaar](https://en.wikipedia.org/wiki/The_Cathedral_and_the_Bazaar)_, to understand why **"Smart data structures and dumb code works a lot better than the other way around."** _-- Eric S. Raymond_


## Usage

Because the problem domain is vast (i.e., _everything_ can be described with a data structure), Panzer offers a bevy of features for you to use a la carte. The following are either covered in the **Usage** section below, pending documentation, or amongst Panzer's 400+ unit tests:

  * Current state & position
  * Delegate classes and configurations
  * Event object reflection
  * Navigation control interface
  * Navigation loop & events life-cycle
  * Nodal behavior & logic
  * Node & attribute parsing
  * Promise-enabled parsing, initialization, and navigation
  * Prototypal inheritance, inspection and reflection
  * Reusable instances

### Customizing with Packages

### Parsing Values

##### Identifying Attributes

##### Ignoring Object Members

##### Processing Nodes

###### Asynchronous Node Processing

### Navigating the Node-Tree

First, create a Panzer class.

```js
var BasicTree = Panzer.create();
```

In order to access and extend Panzer's functionality, we need to define a package. (Otherwise, our instances won't do much.) Let's register a new package by name.

```js
var myPkgDef = BasicTree.pkg('my first package');
```

The returned value is the _package-definition_, a function with special members that hook into our class. Many hooks are available, but we'll prototype an instance method now.

```js
myPkgDef.fn.onward = function () {
    var
        // get the corresponding package-instance
        tree = myPkgDef(this),
        // alias the tank that controls our tree's "pointer"
        tank = tree.tank,
        // reference the current node
        currentNode = tree.nodes[tank.currentIndex],
        // reference a sibling or child node, if available
        nextNode = tree.nodes[currentNode.nextIndex || currentNode.firstChildIndex];
    // if there is a nextNode and we've successfully navigated to it...
    if (nextNode && tank.go(nextNode.index)) {
        // return the value of (what is now) the current node
        return nextNode.value;
    }
    // (otherwise) flag that no node is next
    return false;
};
```

Though simple enough, there is a lot going on in our method. Nevertheless, we can now "walk" the left-branch of any data structure.

```js
var
    myTree = new BasicTree({hello: 'world'}),
    nodeValue, lefties = [];
while (nodeValue = myTree.onward()) {
    lefties.push(nodeValue);
}
//
// lefties[0] -> {hello: 'world'}
// lefties[1] -> 'world'
//
```

Understanding the package api is key to getting the most from your class. However, in lieu of full documentation, please see the test suite for greater insight. Thanks for your patience!


## API

This section serves as reference documentation to using the Panzer module. The module exports a `Panzer` namespace.

Instance methods are prefixed with a pound-symbol (#). Instance properties are prefixed with an at-symbol (@). Static members (both properties and methods) are prefixed with a double-colon (::).

### Panzer::create()

Create a unique Panzer class.

```js
var Klass = Panzer.create();
```

Returns a constructor function, informally called a _Klass_.

### Panzer::version

The [SemVer](http://semver.org) compatible version string.

```js
Panzer.version;
```

### Klass

Instantiate a Klass instance.

```js
new Klass([source [, config]]);
```

  * **source**: _(mix)_ A value to be parsed into nodes.
  * **config**: _(object)_ Used by packages, during initialization.

Returns a promise when invoked _without_ `new`. The promise resolves with the initialized Klass instance.

The Klass prototype inherits from it's package (`PkgDef.fn`).

#### Klass::id

A unique numeric identifier.

```js
Klass.id;
```

#### Klass::pkg()

Retrieve, create, and list packages.

  1. Returns an array of package names.
    ```js
    Klass.pkg();
    ```
  1. Returns a new or existing package.
    ```js
    Klass.pkg(name);
    ```
      * **name**: _(string)_ An alphanumeric string.

Throws when given anything but an alphanumeric string.

A _package_ is a delegate class, event subscriber, and collection of tree parsing rules and logic. A Klass  may many packages.

#### Klass@ready

A promise that resolves after this instance has initialized.

```js
klass.ready;
```

This instance property is a _thenable_, from which you may use [Promise.then](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise/then).

The promise resolves with the initialized Klass instance.

#### Package::attrKey

A rule that determines whether an object member should be parsed as a node attribute.

```js
PkgDef.attrKey = rule;
```

By default, _rule_ is `false` and may be any falsy value.

When a string, during parsing, member keys that begin with this rule become node attributes. (The comparison is case-sensitive.)

When a regular expression, during parsing, member keys that match this rule become node attributes.

When a function, during parsing, returning a truthy value makes this member a node attribute.
Functions receive two arguments, the member name and value. (The first member name is an empty string.)

#### Package::badKey

A rule that determines whether an object member should not be excluded from the node-tree.

```js
PkgDef.badKey = rule;
```

By default, _rule_ is `false` and may be any falsy value.

When a string, during parsing, member keys that begin with this rule are excluded from the node-tree. (The comparison is case-sensitive.)

When a regular expression, during parsing, member keys that match this rule are excluded from the node-tree.

When a function, during parsing, returning a truthy value excludes this member from the node-tree.
Functions receive two arguments, the member name and value. (The first member name is an empty string.)

#### Package::cloneable

Indicates when a Klass instance's nodes may be copied for a new instance.

```js
PkgDef.cloneable = setting;
```

By default, _setting_ is `true` and may be any truthy value.

With more than one package, all must use a truthy value. If not, the new proxy object will parse the given proxy object's original source value.

#### Package::getSuper()

Retrieve the same-name member from an older Package's Klass prototype.

```js
PkgDef.getSuper(name);
```

  * **name** (string) name of the member to retrieve.

Returns `undefined` when the member is not defined.

#### Package::index

The zero-index order that this package was defined.

```js
PkgDef.index;
```

#### Package::off()

Unsubscribe from tank events.

```js
PkgDef.off([name [, callback]]);
```

  * **name** - (string) The name of the event to stop listening.
  * **callback** - (function) The method that was previously subscribed.

Returns the same package definition object.

Removes all subscribers (via this package), when called without arguments.

Removes all subscribers to the given event (via this package), if _callback_ is omitted.

Removes the given callback from the given event (subscribed via this package), when called with both arguments.

#### Package::on()

Subscribe to tank events.

```js
PkgDef.on([name [, callback]]);
```

Returns the same package definition object.

  * **name** - (string|strings) The event name (or array of event names) to observe.
  * **callback** - (function) The method to invoke when the event is triggered.



#### Package::prepNode

Determines how and which object members are parsed into nodes.

```js
PkgDef.prepNode = funcRef;
```

_funcRef_ is a function that is called during instantiation, and returns what will be the node's value. Within the function, `this` is the _global/window_ object. (Members of the returned value are further parsed.) If a Promise is returned, the resolved value is used.

The first argument passed to the specified function is the object's member's name, as a string. This argument is an empty string, when first called, per instantiation.

The second argument passed to the specified function is the object's member's value. This argument is the value passed to the Klass function, when first called, per instantiation.

#### Package::fn

An inherited chain of the Klass prototype.

```js
PkgDef.fn;
```

Like any prototype Members of _fn_ are available to all Klass instances. Precedence is given to the most recently registered Package.

#### Package@nodes

An array of nodes.

```js
pkg.nodes;
```

Each _node_ is an object that represents a position in the node-tree, along with a value - parsed from the value parsed from the Klass instance.

This array is empty (until initialization), while node-parsing and/or initialization is delayed.

describing their structure and position, and value, respectively.

  Each node is an Object instance with the following properties:

    * **attrs** :
    * **childIndex** :
    * **children** :
    * **depth** :
    * **firstChildIndex** :
    * **index** :
    * **lastChildIndex** :
    * **nextIndex** :
    * **parentIndex** :
    * **path** :
    * **previousIndex** :
    * **value** :

#### Package@pkgs

#### Package@proxy

#### Package@tank


#### Tank#go()

#### Tank@active

#### Tank@id

#### Tank@cc

#### Tank@index

#### Tank@target

#### Tank#queue()

#### Tank@queued

#### Tank#block()

#### Tank@blocked

### Event

#### Event@id

#### Event@order

#### Event@tid

#### Event@trip

#### Event@leg

#### Event@command

#### Event@type

#### Event@index

#### Event@path

#### Event@depth

#### Event@stack

#### Event@trail

#### Event@proxy

#### Event@tally


## Installation

Panzer works within, and is intended for, modern JavaScript environments. It is available on [bower](http://bower.io/search/?q=panzer), [component](http://component.github.io/) and [npm](https://www.npmjs.org/package/panzer) as a [UMD](https://github.com/umdjs/umd) module (supporting both [CommonJS](http://wiki.commonjs.org/wiki/CommonJS) and [AMD](http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition) loaders).

If Panzer isn't compatible with your favorite runtime, please file an issue or - better still - make a pull-request.

### Dependencies

Panzer has no module dependencies. Panzer should work wherever these ECMAScript 5 & 6 features are native or [polyfilled](https://github.com/es-shims):

  * [Array.every](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/every)
  * [Array.fill](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/fill)
  * [Array.filter](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)
  * [Array.forEach](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach)
  * [Array.isArray](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray?v=example)
  * [Array.map](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/map)
  * [Array.some](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/some)
  * [Function.bind](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)
  * [Promises](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)

### Web Browsers

Use a `<SCRIPT>` tag to load the _panzer.min.js_ file in your web page. Doing so, adds `Panzer` to the global scope.

```html
  <script type="text/javascript" src="path/to/panzer.min.js"></script>
  <script type="text/javascript">
    // ... Panzer dependent code ...
  </script>
```

**Note:** The minified file was compressed by [Closure Compiler](http://closure-compiler.appspot.com/).

### Package Managers

  * `npm install panzer`
  * `component install bemson/panzer`
  * `bower install panzer`

### AMD

Assuming you have a [require.js](http://requirejs.org/) compatible loader, configure an alias for the Panzer module (the term "panzer" is recommended, for consistency). The _panzer_ module exports a module namespace.

```js
require.config({
  paths: {
    panzer: 'my/libs/panzer'
  }
});
```

Then require and use the module in your application code:

```js
require(['panzer'], function (Panzer) {
  // ... Panzer dependent code ...
});
```

**Note:** Prefer AMD optimizers, like [r.js](https://github.com/jrburke/r.js/), over loading the minified file.

## License

Panzer is available under the terms of the [MIT-License](http://www.opensource.org/licenses/mit-license.php).

Copyright 2017, Bemi Faison
