/*!
 * Panzer v0.1
 * http://github.com/bemson/Panzer
 *
 * Dependencies:
 * genData v1.2 / Bemi Faison (c) 2011 / MIT (http://github.com/bemson/genData)
 *
 * Copyright 2012, Bemi Faison
 * Released under the MIT License
 */
!function (inCommonJsEnv, Array, Object, RegExp, window, undefined) {
  // if in a web environment and Panzer already exists...
  if (!inCommonJsEnv && window.Panzer) {
    // don't re-initialize Panzer
    return;
  }
  var
    // set the environent to expose Panzer to
    environment = (inCommonJsEnv) ? exports : window,
    // load or alias genData, based on the execution environment
    genData = (inCommonJsEnv ? require('genData') : window).genData,
    // the current panzer platform - used by shared closures
    PZR,
    // the cached result of ({}).toString
    toStringResult = ({}).toString(),
    // tests the name and/or value of a node, against each package definition's targeted handler
    testNodeKey = function (key, name, value) {
      var
        // shortcut for function handler
        f = key + 'f',
        // shortcut for regular expression
        r = key + 'r';
      // return false if the name is empty, or true when the handler of any package-definition returns true
      return name.length && PZR.d.some(function (pkgDef) {
        // if this key is a function...
        if (pkgDef.c[f]) {
          // return result of call
          return pkgDef.c[f].call(window, name, value);
        }
        // if this key is a regular expression...
        if (pkgDef.c[r]) {
          // return result of test
          return pkgDef.c[r].test(name);
        }
      });
    },
    // spawn generator to extract nodes from the tree parameter
    genNodes = new genData(
      function (name, value, parent, dataset, flags, shared) {
        var
          // alias node
          node = this,
          // flag whether this item is a invalid key
          isInvalidKey = testNodeKey('n', name, value, shared.f, shared.r),
          // flag whether this item is an attribute key
          isAttributeKey = testNodeKey('a', name, value, shared.f, shared.r);
        // if this node's key is invalid or flagged as an attribute (by one any of the packages)...
        if (isInvalidKey || isAttributeKey) {
          // exclude from dataset
          flags.omit = 1;
          // don't scan this value
          flags.scan = 0;
          // if this item is an attribute...
          if (isAttributeKey && !isInvalidKey) {
            // add to the parent's node attributes
            parent.attributes[name] = value;
          }
        } else { // otherwise, when this key is not invalid or an attribute...
          // set default property values to undefined (presence reduces prototype property lookups)
          node.inContext = node.parentIndex = node.previousIndex = node.nextIndex = node.firstChildIndex = node.lastChildIndex = node.childIndex = undefined;
          // capture index of this item once added
          node.index = dataset.length + 1;
          // capture depth
          node.depth = parent ? parent.depth + 1 : 1; // start depth at 1, since _tree node will be prepended later
          // set name
          node.name = parent ? name : '_root';
          // init attributes property - holds all attributes of this node
          node.attributes = {};
          // start or extend parent path
          node.path = parent ? parent.path + name + '/' : '//';
          // init child collection
          node.children = [];
          // if there is a parent node...
          if (parent) {
            // set parent index
            node.parentIndex = parent.index;
            // if there are no children, set first child index
            if (!parent.children.length) parent.firstChildIndex = node.index;
            // capture the index of this node in the parent's child collection
            node.childIndex = parent.children.push(node.index) - 1;
            // set this node as the last child of the parent
            parent.lastChildIndex = node.index;
            // if not the first child...
            if (node.childIndex) {
              // reference index of previous node
              node.previousIndex = parent.children[node.childIndex - 1];
              // reference index of this node in the previous node
              dataset[node.previousIndex - 1].nextIndex = node.index;
            }
          }
        }
      }
    ),
    // spawn generator to clone the nodes generated by the genNodes generator
    genCloneNodes = new genData(
      function (name, value, parent, dataset, flags) {
        // if this is the array container...
        if (!parent) {
          // exclude from the dataset
          flags.omit = 1;
        } else { // otherwise, when a node instance...
          // don't scan further
          flags.scan = 0;
          // with each node property available...
          for (var mbr in value) {
            // if this member is not inherited or inContext...
            if (value.hasOwnProperty(mbr) && mbr !== 'inContext') {
              // copy key and value to new data object
              this[mbr] = value[mbr];
            }
          }
        }
      }
    ),
    // alias the Array's prototype for minification purposes
    arrayPrototype = Array.prototype;
  /**
    Shims for missing native object methods (on crap browsers).
    WARNING: These methods are not robust and do no validation! They merely support the needs of this library.
    Shim these methods yourself before loading this script, if you want something equivalent to https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/
    Ofcourse, we're targeting IE here. I didn't want to include this, but - then again - no one wants to work with IE... We just have to.
  */
  if (!arrayPrototype.some) {
    arrayPrototype.some = function(fnc, scope) {
      for (var i = 0, j = this.length; i < j; i++) {
        if (fnc.call(scope, this[i], i, this)) {
          return true;
        }
      }
      return false;
    };
  }
  if (!arrayPrototype.forEach) {
    arrayPrototype.forEach = function(fnc, scope) {
      for (var i = 0, j = this.length; i < j; i++) {
        fnc.call(scope, this[i], i, this);
      }
    };
  }
  if (!arrayPrototype.map) {
    arrayPrototype.map = function(fnc, scope) {
      var
        i = 0,
        j = this.length,
        results = new Array(j);
      for (; i < j; i++) {
        results[i] = fnc.call(scope, this[i], i, this);
      }
      return results;
    };
  }

  // Tree constructor
  function Tree(panzer, rawtree, pkgConfig) {
    var
      // alias self (for closures)
      tree = this;
    // alias the platform that created this instance and set global flag for shared functions
    tree.panzer = PZR = panzer;
    // init proxy shared objects collection
    tree.y = [
      // [0] the .pkgs member
      {},
      // [1] the fake toString method
      function (platform, pkgName) {
        // when passed this panzer, return the corresponding tree or the default toString result
        return platform === panzer ? (pkgName ? (tree.pkgs[panzer.i[pkgName]] || {}).inst || false : tree) : toStringResult;
      }
    ];
    // with each package...
    panzer.d.forEach(function (pkgDef) {
      var
        // shorthand for attribute key member
        a = pkgDef.def.attributeKey,
        // shorthand for invalid key member
        n = pkgDef.def.invalidKey;
      // set cache for node parsing
      pkgDef.c = {
        // capture when the attribute test is a function
        af: typeof a === 'function' ? a : 0,
        // capture when the attribute test is a regular-expression
        ar: a && a instanceof RegExp ? a : 0,
        // capture when the invalid test is a function
        nf: typeof n === 'function' ? n : 0,
        // capture when the invalid test is a regular-expression
        nr: n && n instanceof RegExp ? n : 0
      };
    });

    // start generating the initial tree
    tree.nodes = genNodes(rawtree);
    // set parent and childIndex of the tree node
    tree.nodes[0].parentIndex = tree.nodes[0].childIndex = 0;
    // prepend the tree node
    tree.nodes.unshift(genNodes()[0]);
    // with the prepended phantom node...
    with (tree.nodes[0]) {
      // reference index of root as child of the tree
      children.push(1);
      // set name
      name = '_tree';
      // set index
      index = 0;
      // set depth
      depth = 0;
      // set path
      path = '..//';
      // flag that we are already "on" this first node
      inContext = 1;
    }
    // reference the first and last child index
    tree.nodes[0].firstChildIndex = tree.nodes[0].lastChildIndex = 1;
    // define tree package-instance api - all package instances control the tree via these members
    tree.tank = {
      // capture and increment the number of trees created on this panzer
      id: panzer.c++,
      // index of the active node
      currentIndex: 0,
      // index of the target node (-1 indicates idle or at rest)
      targetIndex: -1,
      // define scoped call to direct the tree
      go: function (tgtIndex) {
        var
          // alias the target node (if any)
          tgtNode = tree.nodes[tgtIndex];
        // if a numeric index and valid node were targeted...
        if (tgtNode) {
          // capture the targeted node
          tree.target = tgtNode;
          // expose target index via panzer namespace
          tree.tank.targetIndex = tgtNode.index;
        }
        // clear internal stop flag
        tree.stop = 0;
        // return number of steps traversed
        return tree.go();
      },
      // define scoped call to stop the tree
      stop: function () {
        // set internal stop flag
        tree.stop = 1;
        // return truthy when this tree is in a loop, otherwise falsy
        return !!tree.loop;
      },
      // add/remove post-loop callbacks
      post: function (param) {
        // based on the type...
        switch (typeof param) {
          case 'function':
            // return an index after adding the callback
            return tree.posts.push(param) - 1;
          break;

          case 'number':
            // if a callback exists at this index...
            if (tree.posts[param]) {
              // clear the callback
              tree.posts[param] = 0;
              // return success
              return true;
            }
        }
        // (otherwise) flag that the call failed (throw an error?)
        return false;
      }
    };
    // collection of post-loop callbacks queue
    tree.posts = [];
    // init current node reference
    tree.current = tree.nodes[0];
    // init target node and loop flags
    tree.target = tree.loop = 0;
    // with each package definition in this panzer...
    tree.pkgs = panzer.d.map(function (pkgDef) {
      var
        // init registry object
        pkgEntry = {
          // the package name (for lookups)
          name: pkgDef.name,
          // instantiate package instance from the definition function
          inst: new pkgDef.def(),
          // init package proxy
          proxy: new pkgProxy()
        };
      // init proxy definition for this package
      function pkgProxy() {}
      // mirror the definition's proxy prototype
      pkgProxy.prototype = pkgDef.proxy;
      // capture the package-instance proxy in the shared proxy object
      tree.y[0][pkgDef.name] = pkgEntry.proxy;
      // clone nodes for this package instance, using this package's node prototype
      pkgEntry.inst.nodes = genCloneNodes(
        // nodes to copy
        tree.nodes,
        // pass no additional parsers
        0,
        // set the prototype of the returned data objects to this package-definition's node constructor
        pkgDef.node
      );
      // if this definition has an .init function...
      if (typeof pkgDef.def.init === 'function') {
        // initialize the package instance, passing in the (extra) configuration object
        pkgDef.def.init.call(pkgEntry.inst, pkgConfig);
      }
      // add this package entry to the registry
      return pkgEntry;
    });
    // with each initialized entry...
    tree.pkgs.forEach(function (pkgEntry, idx, pkgs) {
      // set faux toString method
      pkgEntry.proxy.toString = tree.y[1];
      // add shared proxy object
      pkgEntry.proxy.pkgs = tree.y[0];
      // expose the tree api to the package instance
      pkgEntry.inst.tank = tree.tank;
      // expose last package-proxy to all package instances
      pkgEntry.inst.proxy = pkgs[pkgs.length - 1].proxy;
    });
  }
  Tree.prototype = {
    // head towards the current target
    go: function () {
      var
        // alias self
        tree = this,
        // alias nodes (for minification & performance)
        nodes = tree.nodes,
        // alias tank (for minification & performance)
        tank = tree.tank,
        // direction of traversal movement
        dir,
        // the number of traversal events fired
        traversals = 0,
        // alias the current node (for minification & performance)
        curNode = tree.current,
        // flag when the nextInt is an event (when 0) or node index (when 1)
        nextIsEvent = 0,
        // integer representing the node index or event type
        nextInt = 0,
        // flag when we've fired the end event
        firedEnd;
      // if already looping...
      if (tree.loop) {
        // flag true if there is a current target
        return !!tree.target;
      }
      // reset the posts array
      tree.posts = [];
      // flag that this tree is looping
      tree.loop = 1;
      // fire begin event
      tree.fire('Begin');
      // while looping...
      while (tree.loop) {
        // if there is a target and we haven't stopped...
        if (tree.target && !tree.stop) {
          // reset firedEnd flag
          firedEnd = 0;
          // get traversal direction
          dir = tree.target.index - curNode.index;
          // if going forwards or backwards...
          if (dir) {
            // if going forward on the _tree or tree node, or the target path contains the current path...
            if ((dir > 0 && curNode.index < 2) || !tree.target.path.indexOf(curNode.path)) {
              // if already in context...
              if (curNode.inContext) {
                // flag that we're switching nodes
                nextIsEvent = 0;
                // target the first child
                nextInt = curNode.firstChildIndex;
              } else { // otherwise, if not in context...
                // flag that we're doing an event
                nextIsEvent = 1;
                // set to in event
                nextInt = 1;
                // flag that we're in the current node
                curNode.inContext = 1;
              }
            } else { // otherwise, if the target path is not in the current path...
              // if in the context of the current node...
              if (curNode.inContext) {
                // flag that we're doing an event
                nextIsEvent = 1;
                // set to out event
                nextInt = 2;
                // flag that we're out of the current node
                curNode.inContext = 0;
              } else { // otherwise, when out of this node...
                // if the current node's parent is an ancestor of the target node...
                if (tree.target.path.indexOf(nodes[curNode.parentIndex].path)) {
                  // set direction to backwards
                  dir = -1;
                }
                // predict next event based on the direction
                nextInt = dir < 0 ? 4 : 3;
                // if the last event was out, matches the calculated one, or shows an over occurring after bover (or vice versa)...
                if (curNode.lastEvent === 2 || curNode.lastEvent === nextInt || curNode.lastEvent + nextInt === 7) {
                  // flag that we're changing nodes
                  nextIsEvent = 0;
                  // go forward, backward, or up based on direction
                  nextInt = dir > 0 ? curNode.nextIndex : (curNode.previousIndex || curNode.parentIndex);
                } else { // otherwise, when the last event was not out and won't be repeated...
                  // flag that we're doing an event (the one previously calculated)
                  nextIsEvent = 1;
                }
              }
            }
          } else { // otherwise, when on the target node...
            // flag that we're doing an event
            nextIsEvent = 1;
            // set event to on or in, based on the current context
            nextInt = curNode.inContext ? 0 : 1;
            // if already in context...
            if (curNode.inContext) {
              // clear internal target
              tree.target = 0;
              // clear tank target (set to negative one)
              tank.targetIndex = -1;
            }
            // set context to in
            curNode.inContext = 1;
          }
          // if doing an event...
          if (nextIsEvent) {
            // capture last event
            curNode.lastEvent = nextInt;
            // tick traversal event count
            traversals++;
            // fire traverse event with the resolved next target
            tree.fire('Traverse', [nextInt]);
          } else { // otherwise, when changing the current node...
            // reset lastEvent flag from the current node
            curNode.lastEvent = 0;
            // set internal current node
            curNode = tree.current = nodes[nextInt];
            // set tank target
            tank.currentIndex = nextInt;
          }
        } else if (!firedEnd && (tree.stop || !tree.target)) { // or, when stopped and we did not fire the stop event and we've stopped...
          // note that we've fired the end event
          firedEnd = 1;
          // fire end event
          tree.fire('End');
        } else { // (otherwise), when none of these conditions are met...
          // flag that we're done looping
          tree.loop = 0;
        }
      }
      // fire post-loop functions
      tree.posts.forEach(function (fnc) {
        if (typeof fnc === 'function') {
          // execute this post-function
          fnc();
        }
      });
      // return the number of traversal events fired
      return traversals;
    },
    // fire package event
    fire: function (evtName, args) {
      var
        // alias for closures
        panzer = this.panzer;
      // use args or array - assumes args is an array
      args = args || [];
      // prepend lowercasse form of the event name to arguments, so callbacks can identify the event
      args.unshift(evtName.toLowerCase());
      // with each package instance...
      this.pkgs.forEach(function (pkgEntry) {
        var
          // get event callback from the corresponding package definition
          callback = panzer.d[panzer.i[pkgEntry.name]].def['on' + evtName];
        // if the callback is a function...
        if (typeof callback === 'function') {
          // execute with built args, in scope of the package instance
          callback.apply(pkgEntry.inst, args);
        }
      });
    }
  };

  function PanzerResolvePackage(name) {
    var
      // alias self for closures
      panzer = this;
    // if a name is given...
    if (arguments.length) {
      // if given a valid name to resolve...
      if (typeof name === 'string' && /\w/.test(name)) {
        // if no package has this name...
        if (!panzer.i.hasOwnProperty(name)) {
          var
            // get what will be the index of this package definition
            pkgIndex = panzer.d.length;
          // define a package definition function, which returns the private instance of it's public proxy
          function pkgDef(pxy) {
            // if called without new...
            if (!(this instanceof arguments.callee)) {
              // return the package instance registered at this package definitions index (or false)
              return pxy instanceof panzer.P && pxy.toString(panzer, name);
            }
          }
          // set default static members
          pkgDef.init = pkgDef.attributeKey = pkgDef.invalidKey = pkgDef.onBegin = pkgDef.onEnd = pkgDef.onTraverse = 0;
          // define new proxy-model for this package
          function proxyModel() {}
          proxyModel.prototype = new panzer.Y();
          // chain existing proxy model, then expose the prototype in the package-definition and assign to the TreeProxy prototype
          panzer.P.prototype = pkgDef.proxy = proxyModel.prototype;
          // set new proxy model for this panzer
          panzer.Y = proxyModel;
          // define new node constructor
          function nodeModel() {}
          // expose the node's prototype in the package-definition
          pkgDef.node = nodeModel.prototype;
          // define and index this package definition for this panzer
          panzer.i[name] = panzer.d.push({
            // the package name
            name: name,
            // the (public) definition function
            def: pkgDef,
            // the proxy constructor
            proxy: proxyModel,
            // the node constructor
            node: nodeModel
          }) - 1;
        }
        // return the package definition's pkg function
        return panzer.d[panzer.i[name]].def;
      }
      // (otherwise) flag that the package name is invalid
      return false;
    }
    // (otherwise) return list of package names
    return panzer.d.map(function (pkgDef) {
      // extract the package name
      return pkgDef.name;
    });
  }

  // expose public Panzer namespcae
  environment.Panzer = {
    version: '0.1',
    create: function () {
      var
        //a panzer platform
        panzer = {
          // number of trees created with this panzer
          c: 0,
          // packages list
          d: [],
          // packages index
          i: {},
          // base proxy prototype
          Y: function () {},
          // proxy constructor
          P: PanzerKlass
        };

      // init panzer wrapper
      function PanzerKlass(tree, pkgConfig) {
        // if not invoked with the "new" operator...
        if (!(this instanceof arguments.callee)) {
          // throw error
          throw new Error('Missing new operator.');
        }
        // (otherwise) with properties from a new tree...
        with (new Tree(panzer, tree, typeof pkgConfig === 'object' ? pkgConfig : {})) {
          // alias it's proxy collection
          this.pkgs = y[0];
          // override the built-in toString method
          this.toString = y[1];
        }
      }
      // add pkg method
      PanzerKlass.pkg = function (name) {
        // return result of resolving a package for this panzer
        return PanzerResolvePackage.apply(panzer, arguments);
      };
      // set TreeProxy prototype to the panzer's proxy base
      //TreeProxy.prototype = panzer.Y;
      // return the panzer platform
      return PanzerKlass;
    }
  };
}(typeof require !== 'undefined', Array, Object, RegExp, this);