# Panzer

[![Build Status](https://travis-ci.org/bemson/panzer.png)](https://travis-ci.org/bemson/panzer)

version 0.3.13
by Bemi Faison

A comprehensive node-tree solution, for smart data.\*

## DESCRIPTION

Panzer is a JavaScript class factory that implements tree parsing, traversal and monitoring. Panzer separates node behavior, structure, and navigation concerns, so you can design classes that do just what you need.

The procedural consumption of "structure" allows data to inform your code's execution, for easier coding. As well, Panzer provides nodal meta-data, like parent-child relationships, depth, child order, etc. - which can be used to solve various problem domains.

The purpose and function of your Panzer is given by it's packages - modules of code that access and extend classes. The package architecture allows several treatments of an instance, with fewer resource collisions and greater interoperability than traditional plug-in schemes.

__\*__ Read _[The Cathedral and the Bazaar](http://www.redhat.com/support/wpapers/community/cathedral/whitepaper_cathedral-5.html)_, to understand why **"Smart data structures and dumb code works a lot better than the other way around."**

## INSTALL

### Web Browsers

Use a `<SCRIPT>` tag to reference panzer.min.js, as you would any external JavaScript file. The "Panzer" namespace will be added to the global scope.

```html
  <script type="text/javascript" src="somepath/panzer.min.js"></script>
  <script type="text/javascript">
    // ... Panzer dependent code ...
  </script>
```

### Node.js

  * `npm install panzer` if you're using [npm](http://npmjs.org/)
  * `component install bemson/panzer` if you're using [component](https://github.com/component/component)
  * `bower install panzer` if you're using [Bower](http://bower.io)


### Dependencies

Panzer requires [genData v3.1.0](https://github.com/bemson/genData). (The minified file includes this dependency.)

## USAGE

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
myPkgDef.proxy.onward = function () {
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

## FILES

* src/ - Directory containing the source code
* test/ - [Mocha](http://visionmedia.github.com/mocha) test suite
* README.md - This readme file
* LICENSE - The legal terms and conditions under which this software may be used
* panzer.min.js - The Panzer platform, including dependencies, minified for browser environments

Source files minified with both [UglifyJS](http://marijnhaverbeke.nl/uglifyjs) and [Yahoo! Compressor](http://developer.yahoo.com/yui/compressor/).

## LICENSE

Panzer is available under the terms of the [MIT-License](http://www.opensource.org/licenses/mit-license.php).

Copyright 2014, Bemi Faison
