# Panzer
by Bemi Faison

version 0.1.0
(1/6/12)

## DESCRIPTION

Panzer is a JavaScript platform that defines and navigates node-trees.

Panzer is a JavaScript platform for static tree classes and navigation events.

Panzer is a JavaScript platform for node-tree classes and navigation events.

The purpose and function of your Panzer is given by modules of code, called packages.

The purpose and function


Panzer is a JavaScript platform for navigation events 

Panzer provides navigation events for custom node trees.

Panzer lets you define node tree classes, and respond to navigation events.

Panzer lets you interpret and act on tree structure and navigation.

, using a unique architecture for extension.

 compilation and navigation.

structurestake action on and interpret tree structures, using a .

 Panzer is a JavaScript platform for compiling, prototyping, traversing, and responding to the navigation of tree structures. 

The purpose and function of your Panzer is given by modules of code, called packages.

Panzer generates constructor functions, called "tanks", that represent the many parts of a tree traversal system. These components are augmented and extended with modules of code, called packages.

Though generic enough, the Panzer library was originally designed to support [Flow](https://github.com/bemson/Flow), a robust state-machine framework.

## FILES

* src/ - Directory containing the source code
* test/ - [Qunit](http://docs.jquery.com/QUnit) tests of minified source files
* README.md - This readme file
* LICENSE - The legal terms and conditions under which this software may be used
* panzer-min.js - The Panzer platform, including dependencies, minified for browser environments

Source files minified with [UglifyJS](http://marijnhaverbeke.nl/uglifyjs)

## Dependencies

Panzer requires [genData v1.2](https://github.com/bemson/genData).

## INSTALL

Within web browsers, reference the panzer-min.js file, as you would any external JavaScript library file.

```html
  <script type="text/javascript" src="somepath/panzer-min.js"></script>
  <script type="text/javascript">
    // Your code that uses Panzer...
  </script>
```

For Node, install the panzer module via npm.

```bash
  npm install Panzer
```

Then, for commonJS environments (like Node), require the Panzer module, and reference the exported Panzer namespace.

```js
  var Panzer = require('Panzer').Panzer;

  // Your code that uses Panzer...
```

## USAGE

First create a "tank", using `Panzer.create()`.

```js
	var myTank = Panzer.create();
```
Tanks like `myTank` are constructor functions, which accept two optional parameters. Without customization, however, a tank does nothing useful. Customize your tank, by registering a package, using `<tank>.pkg()`.

```js
	var myPkgDef = myTank.pkg('myPkgName');
```

The return value is a package-definition function, representing the "myPkgName" as package. Read the wiki, to learn how each member property impacts the purpose and operation of the tank.

Once customized, simply create a new instance of your tank!

```js
	var inst = new myTank();
```

## LICENSE

Panzer is available under the terms of the [MIT-License](http://en.wikipedia.org/wiki/MIT_License#License_terms).

Copyright 2011, Bemi Faison