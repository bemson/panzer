/*!
 * Panzer v0.3.5
 * http://github.com/bemson/Panzer
 *
 * Dependencies:
 * genData v2.0.1 / Bemi Faison (c) 2012 / MIT (http://github.com/bemson/genData)
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
    // set the environment to publish Panzer
    environment = (inCommonJsEnv) ? exports : window,
    // load or alias genData, based on the execution environment
    genData = (inCommonJsEnv ? require('genData') : window).genData,
    // the current panzer platform - used by shared closures calling testNodeKey
    PZR,
    // the number of tanks created
    tankCount = 0,
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
      return PZR.d.some(function (pkgDef) {
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
    genNodes = genData.spawn(
      function (name, value, parent, dataset, flags, shared) {
        var
          // alias node
          node = this,
          // flag whether this item is a invalid key, only if this is not the first node
          isBadKey = parent && testNodeKey('n', name, value),
          // flag whether this item is a tag key, only if this is not the first node
          isTagKey = parent && !isBadKey && testNodeKey('a', name, value);
        // if this node's key is invalid or flagged as a tag (by one any of the packages)...
        if (isBadKey || isTagKey) {
          // exclude from dataset
          flags.omit = 1;
          // don't scan this value
          flags.scan = 0;
          // if this item is a tag...
          if (isTagKey && !isBadKey) {
            // add to the parent's node tags
            parent.tags[name] = value;
          }
        } else { // otherwise, when this key is not invalid or a tag...
          // set default property values to undefined (presence reduces prototype property lookups)
          node.ctx = node.lte = node.parentIndex = node.previousIndex = node.nextIndex = node.firstChildIndex = node.lastChildIndex = node.childIndex = undefined;
          // capture index of this item once added
          node.index = dataset.length + 1;
          // capture depth
          node.depth = parent ? parent.depth + 1 : 1; // start depth at 1, since _tree node will be prepended later
          // set name
          node.name = parent ? name : 'PROOT';
          // init tags property - holds all tags of this node
          node.tags = {};
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
          // if not the first node and there are packages...
          if (parent && PZR.d) {
            // step through packages of the current PZR backwards (most recent package gets precedence)...
            PZR.d.reverse().some(function (pkgDef) {
              var
                // alias the package definition
                def = pkgDef.def,
                // capture the extend key result
                substituteParent
              ;
              // if the definition has a prepNode function and it returns an object...
              if (typeof def.prepNode == 'function' && typeof (substituteParent = def.prepNode.call(window, value, dataset[0].value)) != 'undefined') {
                // scan this value as if it were the current node's value
                flags.parent = substituteParent;
                // exit loop
                return true;
              }
            });
          }
        }
      }
    ),
    // spawn generator to clone the nodes generated by the genNodes generator
    genCloneNodes = genData.spawn(
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
            // if this member is not inherited or ctx...
            if (value.hasOwnProperty(mbr) && mbr !== 'ctx') {
              // copy key and value to new data object
              this[mbr] = value[mbr];
            }
          }
        }
      }
    ),
    // alias the Array's prototype for minification purposes
    arrayPrototype = Array.prototype;

  // Tree constructor
  function Tree(panzer, proxyInst, rawtree, pkgConfig) {
    var
      // alias self (for closures)
      tree = this;
    // alias the platform that created this instance and set global flag for shared functions
    tree.panzer = PZR = panzer;
    // init proxy shared objects collection
    tree.y = [
      // [0] the shared <proxy>.pkgs member
      {},
      // [1] the shared <package>.pkgs member
      {},
      // [2] the fake <proxy>.toString method
      function (platform, pkgName) {
        // when passed this panzer, return the corresponding tree or the default toString result
        return platform === panzer ? (pkgName ? (tree.pkgs[panzer.i[pkgName]] || {}).inst || false : tree) : toStringResult;
      }
    ];
    // with each package...
    panzer.d.forEach(function (pkgDef) {
      var
        // shorthand for tag key member
        a = pkgDef.def.tagKey,
        // shorthand for invalid key member
        n = pkgDef.def.badKey;
      // cache node key testers for faster parsing
      pkgDef.c = {
        // capture when the tag test is a function
        af: typeof a === 'function' ? a : 0,
        // capture when the tag test is a regular-expression
        ar: a && a instanceof RegExp ? a : 0,
        // capture when the invalid test is a function
        nf: typeof n === 'function' ? n : 0,
        // capture when the invalid test is a regular-expression
        nr: n && n instanceof RegExp ? n : 0
      };
    });
    // if there are panzer packages...
    if (panzer.d) {
      // with each package definition in this panzer...
      panzer.d.forEach(function (pkgDef) {
        var
          preprocessResult
        ;
        // if there is a pre function in this package's definition and the result is not undefined...
        if (typeof pkgDef.def.prepTree == 'function' && typeof (preprocessResult = pkgDef.def.prepTree.call(window, rawtree)) != 'undefined') {
          // set new rawtree value
          rawtree = preprocessResult;
        }
      });
    }
    // start generating the initial tree
    tree.nodes = genNodes(rawtree);
    // clear PZR reference (for better garbage collection)
    PZR = 0;
    // set parent and childIndex of the tree node
    tree.nodes[0].parentIndex = tree.nodes[0].childIndex = 0;
    // prepend the tree node
    tree.nodes.unshift(genNodes()[0]);
      // NOTE: Perfect case for a "with" statement, but it disrupts minifiers :-(
    // reference index of root as child of the tree
    tree.nodes[0].children.push(1);
    // set name
    tree.nodes[0].name = 'PNULL';
    // set index
    tree.nodes[0].index = 0;
    // set depth
    tree.nodes[0].depth = 0;
    // set path
    tree.nodes[0].path = '..//';
    // flag that we are already "on" this first node
    tree.nodes[0].ctx = 1;
    // reference the first and last child index
    tree.nodes[0].firstChildIndex = tree.nodes[0].lastChildIndex = 1;
    // define tree package-instance api - all package instances control the tree via these members
    tree.tank = {
      // increment and use the number of tanks created, as this instance's id
      id: tankCount++,
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
          inst: new pkgDef.def()
        };
      // init proxy definition for this package
      function pkgProxy() {}
      // mirror the definition's proxy prototype
      pkgProxy.prototype = pkgDef.proxy.prototype;
      // init and capture the package-instance-proxy in the shared .pkgs object
      tree.y[0][pkgDef.name] = pkgEntry.proxy = new pkgProxy();
      // capture this package instance in the shared <package>.pkgs member
      tree.y[1][pkgDef.name] = pkgEntry.inst;
      // add the shared pkgs member to the package instance
      pkgEntry.inst.pkgs = tree.y[1];
      // clone nodes for this package instance, using this package's node prototype
      pkgEntry.inst.nodes = genCloneNodes.call(
        // assign each node to this constructor's prototype
        pkgDef.node
        // nodes to copy
        , tree.nodes
      );
      // expose the tree api to the package instance
      pkgEntry.inst.tank = tree.tank;
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
      // add shared proxy object
      pkgEntry.proxy.pkgs = tree.y[0];
      // set faux toString method
      pkgEntry.proxy.toString = tree.y[2];
      // expose last package-proxy to all proxy instances
      pkgEntry.inst.proxy = proxyInst;
    });
    // add shared proxy object
    proxyInst.pkgs = tree.y[0];
    // set faux toString method
    proxyInst.toString = tree.y[2];
    // flag that this instance is ready
    this.ret = 1;
  }

  Tree.prototype = {
    // head towards the current target
    go: function () {
      var
        // alias self
        tree = this,
        // alias nodes
        nodes = tree.nodes,
        // alias tank
        tank = tree.tank,
        // direction of traversal movement
        dir,
        // the number of traversal events fired
        traversals = 0,
        // alias the current node
        curNode = tree.current,
        // the next phase to traverse (-1 indicates none)
        nextPhase = -1,
        // the next node to target (-1 indicates none)
        nextNodeIndex = -1,
        // last targeted node index
        lastTargetIndex,
        // track when a node is engaged
        nodeEngaged,
        // flag when we've fired the end event
        firedEnd
      ;
      // if already looping...
      if (tree.loop) {
        // flag true when there is a current target
        return !!tree.target;
      }
      // reset the posts array
      tree.posts = [];
      // flag that this tree is looping
      tree.loop = 1;
      // fire begin event
      tree.fire('begin');
      // while looping...
      while (tree.loop) {
        // if there is a target and we haven't stopped...
        if (tree.target && !tree.stop) {
          // reset firedEnd flag
          firedEnd = 0;
          // if the last known target has changed or there is no next phase or node...
          if (lastTargetIndex != tree.target.index || !(~nextPhase | ~nextNodeIndex)) {
            // reset the nextPhase and nextNodeIndex flags
            nextPhase = nextNodeIndex = -1;
            // capture current target index
            lastTargetIndex = tree.target.index;
            // get traversal direction
            dir = lastTargetIndex - curNode.index;
            // if going forwards or backwards...
            if (dir) {
              // if going inside the current node...
              if ((dir > 0 && curNode.index < 2) || !tree.target.path.indexOf(curNode.path)) {
                // if already in the node...
                if (curNode.ctx) {
                  // identify the next node
                  nextNodeIndex = curNode.firstChildIndex;
                } else { // otherwise, if not in this node...
                  // identify the next traversal phase (in)
                  nextPhase = 1;
                }
              } else { // otherwise, when going beyond this node (forward or backwards)....
                // if currently within this node...
                if (curNode.ctx) {
                  // identify the next traversal phase (out)
                  nextPhase = 2;
                } else { // otherwise, when out of this node...
                  // if the current node's parent is not an ancestor of the target node...
                  if (tree.target.path.indexOf(nodes[curNode.parentIndex].path)) {
                    // go up node tree
                    dir = -1;
                  }
                  // if going down the tree...
                  if (dir > 0) {
                    // if the last event was over or this node was exited...
                    if (curNode.lte == 3 || curNode.lte == 2) {
                      // go to sibling
                      nextNodeIndex = curNode.nextIndex;
                    } else {
                      // go over
                      nextPhase = 3;
                    }
                  } else { // when going up the tree...
                    // if the last event was bover or this node was exited...
                    if (curNode.lte == 4 || curNode.lte == 2) {
                      // go to sibling or parent node
                      nextNodeIndex = curNode.previousIndex || curNode.parentIndex;
                    } else {
                      // go bover
                      nextPhase = 4;
                    }
                  }
                }
              }
            } else { // otherwise, when on the target node...
              // set event to on or in, based on the node's current context
              nextPhase = curNode.ctx ? 0 : 1;
            }
          } else { // otherwise, when the target is the same and there is a phase or node to navigate...
            // if changing nodes or traversing a node that is not engaged...
            if (~nextNodeIndex || !nodeEngaged) {
              // if this current node has been engaged...
              if (nodeEngaged) {
                // fire release event and release this node
                tree.fire('target', (nodeEngaged = 0));
              } else { // otherwise, when the current node has been released...
                // if changing nodes...
                if (~nextNodeIndex) {
                  // reset last traversal event of the current node
                  curNode.lte = 0;
                  // change the current node
                  curNode = tree.current = nodes[nextNodeIndex];
                  // update tank
                  tank.currentIndex = nextNodeIndex;
                  // reset the nextNodeIndex flag
                  nextNodeIndex = -1;
                }
                // fire engage event and engage node
                tree.fire('target', (nodeEngaged = 1));
              }
            } else { // otherwise, when traversing a node or already engaged...
              // if out of context and traversing in or out...
              if (!curNode.ctx && (nextPhase == 1 || nextPhase == 2)) {
                // if traversing out...
                if (nextPhase == 2) {
                  // clear target phase
                  nextPhase = -1;
                } else { // otherwise, when traversing in...
                  // update node context
                  curNode.ctx = 1;
                }
                // fire scope in/out event
                tree.fire('scope', curNode.ctx);
              } else { // otherwise, if already scoped when properly scoped...
                // track this traversal event
                curNode.lte = nextPhase;
                // tick traversal event count
                traversals++;
                // if traversing on a node...
                if (!nextPhase) {
                    // clear the target
                    tree.target = 0;
                    // update tank
                    tank.targetIndex = -1;
                }
                // fire traversal event
                tree.fire('traverse', nextPhase);
                // if traversed out of a node...
                if (nextPhase == 2) {
                  // change node context
                  curNode.ctx = 0;
                } else { // otherwise, for all other traversals...
                  // clear target phase now
                  nextPhase = -1;
                }
              }
            }
          }
        } else if (nodeEngaged) { // or, when the current node is (still) engaged...
          // fire release event and release node
          tree.fire('target', (nodeEngaged = 0));
        } else if (!firedEnd) { // or, when the end event has not fired...
          // note that we've fired the end event
          firedEnd = 1;
          // fire end event
          tree.fire('end');
        } else { // otherwise, when the end event has fired...
          // flag that we're done looping
          tree.loop = 0;
        }
      }
      // with each item in .posts...
      tree.posts.forEach(function (fnc) {
        // if there is something to execute...
        if (fnc) {
          // execute the post-function
          fnc();
        }
      });
      // return the number of traversal events fired
      return traversals;
    },
    // fire package event
    fire: function (eventName) {
      var
        // resolve callback in packages
        packageCallbackName = 'on' + eventName.charAt(0).toUpperCase() + eventName.substr(1),
        // alias arguments for callbacks
        packageCallbackArgs = arguments,
        // alias for closures
        panzer = this.panzer
      ;
      // if this instance is ready...
      if (this.ret) {
        // with each package instance...
        this.pkgs.forEach(function (pkgEntry) {
          var
            // get event callback from the corresponding package definition
            packageCallback = panzer.d[panzer.i[pkgEntry.name]].def[packageCallbackName];
          // if the callback is a function...
          if (typeof packageCallback == 'function') {
            // execute in scope of the package-instance, with the resolved arguments
            packageCallback.apply(pkgEntry.inst, packageCallbackArgs);
          }
        });
      }
    }
  };

  function PanzerGetSuperMethod(pkgIdx, name) {
    // return the target method from the previous package or false
    // TODO: fire warning when no super method exists?
    return (typeof name === 'string' && pkgIdx && this.d[pkgIdx - 1].proxy.prototype[name]) || false;
  }

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
          // define a package definition function, which returns the private instance of it's public proxy
          function pkgDef(pxy) {
            // if called without new...
            if (!(this instanceof arguments.callee)) {
              // return the package instance registered at this package definitions index (or false)
              return pxy instanceof panzer.d[0].proxy && pxy.toString(panzer, name);
            }
          }
          // set package definition super-method finder
          pkgDef.getSuper = function (name) {
            // return result of finding super version of the given method
            return PanzerGetSuperMethod.call(panzer, this.index, name);
          };
          // set default static members
          pkgDef.init = pkgDef.tagKey = pkgDef.badKey = pkgDef.onBegin = pkgDef.onEnd = pkgDef.onTraverse = pkgDef.onTarget = pkgDef.onScope = pkgDef.prepTree = pkgDef.prepNode = 0;
          // define new proxy-model for this package
          function proxyModel() {}
          // chain the existing proxy prototype to the new one
          proxyModel.prototype = new panzer.Y();
          // chain existing proxy model, then expose the prototype in the package-definition and assign to the TreeProxy prototype
          panzer.P.prototype = pkgDef.proxy = proxyModel.prototype;
          // set new proxy model for this panzer
          panzer.Y = proxyModel;
          // define new node constructor
          function nodeModel() {}
          // expose the node's prototype in the package-definition
          pkgDef.node = nodeModel.prototype;
          // define and index this package definition for this panzer, and capture index in package definition
          pkgDef.index = panzer.i[name] = panzer.d.push({
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
    version: '0.3.5',
    create: function () {
      var
        // a panzer platform
        panzer = {
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
        // create a private tree that references this proxy object
        new Tree(panzer, this, tree, typeof pkgConfig === 'object' ? pkgConfig : {});
      }
      // add pkg method
      PanzerKlass.pkg = function (name) {
        // return result of resolving a package for this panzer
        return PanzerResolvePackage.apply(panzer, arguments);
      };
      /*
      packageDefinition.addInitializer(fnc);
      Klass.pkg(name, fnc); -> auto executes fnc
      Each package definition will have .addInitializer(), which takes a function or the arguments object (to extract the .callee function)
      Allow packages to have multiple initializers by accepting a second param in .pkg() - each fnc is given the package definition and called in scope of the window (global)
      */
      // set TreeProxy prototype to the panzer's proxy base
      //TreeProxy.prototype = panzer.Y;
      // return the panzer platform
      return PanzerKlass;
    }
  };
}(typeof require !== 'undefined', Array, Object, RegExp, this);