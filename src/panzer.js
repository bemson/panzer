/*!
 * Panzer v0.4.0
 * http://github.com/bemson/Panzer
 *
 * Copyright 2012, Bemi Faison
 * Released under the MIT License
 */
!function (inAMD, inCJS, Object, RegExp, Promise, scope, undefined) {

  // dependent module initializer
  function initPanzer() {
    var
      hasKey = Function.prototype.call.bind(Object.prototype.hasOwnProperty),
      klassId = 0,
      klassInstCnt = 0,
      eventStack = [],
      ObjectToStringResult = ({}).toString(),
      r_rxpChars = /([\$\^\-\*\|\{\[\.\(\?])/g,
      eventNameMap = [
        'intercept',
        'begin',
        'move',
        'engage',
        'release',
        'idle',
        'end',
        'switch',
        'switch-resume',
        'scope',
        'scope-resume',
        'traverse',
        'traverse-resume',
        'init'
      ],
      INTERCEPT = 0,
      BEGIN = 1,
      MOVE = 2,
      ENGAGE = 3,
      RELEASE = 4,
      IDLE = 5,
      END = 6,
      SCOPE = 7,
      SWITCH = 9,
      TRAVERSE = 11,
      INIT = 13
    ;


    // UTILITY


    function isFullString(value) {
      return value && typeof value === 'string';
    }

    function isFunction(value) {
      return typeof value === 'function';
    }

    function is(obj, fn) {
      return obj instanceof fn;
    }

    function isPromise(obj) {
      return is(obj, Promise);
    }

    function isNotNullOrUndefined(value) {
      return value !== null && typeof value !== 'undefined';
    }

    function mix(base, tpl) {
      var key;

      // with each key...
      for (key in tpl) {
        // if not inherited...
        if (hasKey(tpl, key)) {
          // copy member and value
          base[key] = tpl[key];
        }
      }

      // return the target object
      return base;
    }

    function promisedForEach(ary, iterFn, valueFn, index) {
      var
        aryLn = ary.length,
        loopIdx = 0,
        result
      ;

      // on first iteration
      if (!index) {
        // clone the source array
        ary = ary.concat();
        // init the index
        index = 0;
      }

      function processReturnValue(val) {
        var rslt = valueFn(val, index);
        index++;

        return rslt;
      }

      // handle completion of promise
      function handlePromise(val) {
        var rslt = processReturnValue(val);
        // if there are more items to address...
        if (ary.length) {
          return promisedForEach(ary, iterFn, valueFn, index);
        }
        return rslt;
      }

      for (; loopIdx < aryLn; loopIdx++) {
        result = iterFn(ary.shift(), index);
        if (isPromise(result)) {
          return result.then(handlePromise);
        } else {
          processReturnValue(result);
        }
      }

      return result;
    }


    // EVENTS


    function onEventer(evt, callback) {
      var me = this;

      if (isFullString(evt) && isFunction(callback)) {
        if (!hasKey(me._evts, evt)) {
          // init event queue
          me._evts[evt] = [];
        }
        // add callback to event queue
        me._evts[evt].push(callback);
      }
      return me;
    }

    function offEventer(evt, callback) {
      var
        me = this,
        cbs,
        cbLn,
        argLn = arguments.length
      ;

      if (!hasKey(me, '_evts') || !argLn) {
        // reset if clearing all events
        me._evts = {};
      } else if (
        isFullString(evt) &&
        hasKey(me._evts, evt)
      ) {
        cbs = me._evts[evt];
        if (isFunction(callback)) {
          cbLn = cbs.length;
          // remove the last matching callback only
          while (cbLn--) {
            if (cbs[cbLn] === callback) {
              cbs.splice(cbLn, 1);
              break;
            }
          }
        }
        // remove event queue if no callback or none left
        if (argLn < 2 || !cbs.length) {
          delete me._evts[evt];
        }
      }

      return me;
    }

    function fireTreeEvent(tree, eventIdx, params, tally, eid) {
      var
        curNode = tree.current,
        curIndex = curNode.index,
        eventName = eventNameMap[eventIdx],
        eventObj = {
          // tank id
          id: tree.tank.id,
          // count of this journey
          trip: tree.tc,
          // count of legs in this journey
          leg: tree.lc,
          // source instruction count
          order: tree.ic,
          // the event type
          type: eventName,
          // the target node index during this event
          targetIndex: tree.tank.targetIndex,
          // the target path during this event
          targetPath: curNode.path,
          // snap the event stack
          stack: eventStack.concat(),
          // the proxy instance corresponding this event
          proxy: tree.pxy,
          // event counts
          tally: tally
        },
        fnResults = [],
        lastHold = tree.holds[eid],
        pkgs = tree.pkgs,
        pkgIdx = 0,
        promising = 0,
        pkgEntry,
        pkgDef,
        fns,
        fnLn,
        fnIdx,
        fnResult
      ;

      // prepend this event to the stack
      eventStack.unshift(eventObj);
      // prepend event to params
      params.unshift(eventObj);

      // with each tree package...
      for (; pkgEntry = pkgs[pkgIdx]; pkgIdx++) {

        // alias the (public) package definition
        pkgDef = pkgEntry.pkg.def;

        // if this event is registered...
        if (hasKey(pkgDef._evts, eventName)) {

          // alias the callback queue and length
          fns = pkgDef._evts[eventName];
          fnLn = fns.length;

          // capture and expose the package instance
          tree.pkg = pkgEntry.inst;

          // expose active package name
          tree.pkgName = pkgEntry.name;

          // expose index of the active package
          // used by tanks calls
          tree.pkgIdx = pkgIdx;

          // with each package callback...
          for (fnIdx = 0; fnIdx < fnLn; fnIdx++) {
            // invoke and capture the return value
            fnResults[fnResults.length] =
            fnResult =
              fns[fnIdx].apply(pkgEntry.inst, params);

            // if not already promising, and the result is a promise...
            if (!promising && isPromise(fnResult)) {
              // flag that we're promising
              promising = 1;
              // automatically lock tree
              tree.lock();
            }
          }
        }
      }

      // remove this event from the stack
      eventStack.shift();

      // if there was at least one promise...
      if (promising) {
        // if there is an existing hold for this event id...
        if (lastHold) {
          // add this instruction count
          lastHold[0].push(tree.ic);
          // add additional promise(s)
          lastHold[1] = lastHold[1].concat(fnResults);
        } else { // (otherwise) when there's no existing hold...
          // alias and create new hold
          lastHold =
          tree.holds[eid] =
            [
              // instruction calls that got delayed
              [tree.ic],
              // blocking promise(s) - mixed with values
              fnResults
            ];
        }

        // return summary promise
        return Promise.all(lastHold[1]);
      }

      // (otherwise) just return the results
      return fnResults;
    }

    // DOMAIN

    function resultIsNotfalse(result) {
      return result !== false;
    }

    function resultIsTrue(result) {
      return result === true;
    }

    // return array of counts per event
    function createEventTally() {
      return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }

    // increment event tally
    function tickEventTally(tally, eventIndex) {
      return ++tally[eventIndex];
    }

    // init and increment event tally for a node
    function tickNodeEventTally(nodes, nodeIndex, eventIndex) {
      // if this node has no event tally...
      if (!nodes[nodeIndex]) {
        // create new event tally array
        nodes[nodeIndex] = createEventTally();
      }
      // return incremented tally value
      return tickEventTally(nodes[nodeIndex], eventIndex);
    }

    // shared package method for retrieving node attributes
    function getTreeNodeAttributes(index) {
      var tree = this;

      // if not a number...
      if (typeof index !== 'number') {
        index = tree.current.index;
      } else if ( // (otherwise) if the index is...
        // outside a valid node index, or...
        index < 0 || index >= nodesLn ||
        // not a whole number...
        ~~index !== index
      ) {
        // exit early as failed request
        return false;
      }

      // (otherwise) return attributes of the target node
      return tree.nodes[index].attrs;
    }

    function getInitialNodes(source) {
      var
        nullNode = initTreeNodeMembers({}),
        rootNode = initTreeNodeMembers({})
      ;

      nullNode.name = 'PNULL';
      nullNode.path = '..//';
      nullNode.children[0] = 1;

      rootNode.name = 'PROOT';
      rootNode.value = source;
      rootNode.path = '//';

      nullNode.firstChildIndex =
      nullNode.lastChildIndex =
      rootNode.index =
      rootNode.depth =
        1;

      nullNode.index =
      nullNode.depth =
      rootNode.parentIndex =
      rootNode.childIndex =
        0;

      // return nodes
      return [nullNode, rootNode];
    }

    function initTreeNodeMembers(node) {
      node.attrs = {};
      node.children = [];

      // init properties (for faster lookups)
      node.parentIndex =
      node.previousIndex =
      node.nextIndex =
      node.firstChildIndex =
      node.lastChildIndex =
      node.childIndex =
        -1;

      return node;
    }

    function makeTreeNodes(
      source,
      attrKeyFns,
      attrKeyRxps,
      badKeyFns,
      badKeyRxps,
      prepNodeFns,
      // these parameters enable keeping state
      nodes,
      queue,
      keyTestCache,
      attrTestCache,
      hasResolverFns
    ) {
      var
        node,
        name,
        value,
        parent,
        rslt
      ;

      function setLoopVars(queuedItem) {
        name = queuedItem[0];
        value = queuedItem[1];
        parent = queuedItem[2];
      }

      function fnKeyTest(testFn) {
        return testFn(name, value);
      }

      function rxpKeyTest(testRxp) {
        return testRxp.test(name);
      }

      function keyTest(cache, rxps, fns) {
        if (!hasKey(cache, name)) {
          cache[name] =
            rxps.some(rxpKeyTest) ||
            fns.some(fnKeyTest);
        }
        return cache[name];
      }

      function resolveNodeValue(value) {
        var
          fauxParent = {
            name: parent.name,
            index: parent.index,
            depth: parent.depth
          },
          proposedIndex = nodes.length - 1,
          proposedDepth = fauxParent.depth + 1
        ;

        return promisedForEach(
          prepNodeFns,
          function (prepNodeFn) {
            return prepNodeFn(
              name,               // node key
              value,              // node value
              proposedIndex,      // proposed index
              proposedDepth,      // proposed depth
              fauxParent,         // parent detail
              source              // original tree
            );
          },
          function (thing) {
            // if the resolved value is not null or undefined...
            if (isNotNullOrUndefined(thing)) {
              // use as new value
              value = thing;
            }

            return value;
          }
        );
      }

      function addChildrenToQueue(thing) {
        var
          kids = [],
          key
        ;
        // only scan non-null objects...
        if (thing && typeof thing === 'object') {
          for (key in thing) {
            if (hasKey(thing, key)) {
              kids.push([
                key,
                thing[key],
                node
              ]);
            }
          }
          // prepend children to queue
          queue = kids.concat(queue);
        }
      }

      // promise handler
      function resumeMakingTree(val) {
        // add object properties to queue
        addChildrenToQueue(val);
        // resume with the current state
        return makeTreeNodes(
          source,
          attrKeyFns,
          attrKeyRxps,
          badKeyFns,
          badKeyRxps,
          prepNodeFns,
          nodes,
          queue,
          keyTestCache,
          attrTestCache,
          hasResolverFns
        );
      }

      // if first run...
      if (!nodes) {
        nodes = getInitialNodes(source);
        queue = [];
        keyTestCache = {};
        attrTestCache = {};
        // set initial node, to be used as first "parent"
        node = nodes[1];
        // set name to faux value
        name = node.name;
        // set initial value to resolve
        value = source;
        // set initial parent (needed for resolution)
        parent = nodes[0];

        if (prepNodeFns.length) {
          // flag that we have resolver functions
          hasResolverFns = 1;
          // resolve node value (uses "resolve" event handlers)
          rslt = resolveNodeValue(value);

          // if promised a value...
          if (isPromise(rslt)) {
            // return promise to return a tree
            return rslt.then(resumeMakingTree);
          }
        }
        // queue members of the final (synchronous) value
        addChildrenToQueue(value);
      }

      while (queue.length) {

        // set vars to use in this loop
        setLoopVars(queue.shift());

        // skip invalid nodes
        if (keyTest(keyTestCache, badKeyRxps, badKeyFns)) {
          continue;
        }

        // capture and skip attributes
        if (keyTest(attrTestCache, attrKeyRxps, attrKeyFns)) {
          parent.attrs[name] = value;
          continue;
        }

        // start building a new node
        node = {
          name: name,
          value: value,
          depth: parent.depth + 1,
          path: parent.path + name + '/',
          parentIndex: parent.index
        };

        initTreeNodeMembers(node);

        // add to nodes
        node.index = nodes.push(node);

        if (!parent.children.length) {
          parent.firstChildIndex = node.index;
        }
        node.childIndex = parent.children.push(node.index) - 1;
        parent.lastChildIndex = node.index;

        // update younger sibling
        if (node.childIndex) {
          node.previousIndex = parent.children[node.childIndex - 1];
          nodes[node.previousIndex - 1].nextIndex = node.index;
        }

        if (hasResolverFns) {
          // resolve node value (uses "resolve" event handlers)
          rslt = resolveNodeValue(value);

          // if promised a value...
          if (isPromise(rslt)) {
            // return promise to return a tree
            return rslt.then(resumeMakingTree);
          }
        }
        // queue members of the final (synchronous) value
        addChildrenToQueue(value);
      }

      return nodes;
    }

    function compileNodes(tree, source, done) {
      var
        panzer = tree.pzr,
        panzerPkgs = panzer.pkgs,
        pkgIdx = 0,
        attrKeyFns = [],  // attribute function tests
        attrKeyRxps = [], // attribute regexp tests
        badKeyFns = [],   // node function tests
        badKeyRxps = [],  // node regexp tests
        pkgDef,
        prepNodeFns = [],
        rslt
      ;

      function mapTest(test, fncAry, rxpAry) {
        if (isFunction(test)) {
          fncAry.push(test);
        } else if (is(test, RegExp)) {
          rxpAry.push(test);
        } else if (isFullString(test)) {
          rxpAry.push(new RegExp('^' + test.replace(r_rxpChars, '\\$1')));
        }
      }

      // with each package
      for (; pkgDef = panzerPkgs[pkgIdx]; pkgIdx++) {
        pkgDef = pkgDef.def;
        // collect & map attribute test
        mapTest(
          pkgDef.attrKey,
          attrKeyFns,
          attrKeyRxps
        );
        // collect & map bad-node test
        mapTest(
          pkgDef.badKey,
          badKeyFns,
          badKeyRxps
        );
        // collect node resolution function
        if (isFunction(pkgDef.prepNode)) {
          prepNodeFns.push(pkgDef.prepNode);
        }
      }

      // parse source into serialized nodes
      rslt = makeTreeNodes(
        source,
        attrKeyFns,
        attrKeyRxps,
        badKeyFns,
        badKeyRxps,
        prepNodeFns
      );

      // if nodes are still resolving...
      if (isPromise(rslt)) {
        // once compiled...
        return rslt.then(function (nodes) {
          finishTreeInit(tree, nodes, done);
        });
      }

      // (otherwise) finish Tree initialization now
      finishTreeInit(tree, rslt, done);

    }

    function finishTreeInit(tree, nodes, done) {
      var
        panzer = tree.pzr,
        nodesLn = nodes.length,
        proxy = tree.pxy,
        proxyToString = proxy.toString,
        pkgProxyKeys = proxy.pkgs,
        pkgInstKeys = {},
        sharedNodeAttrGetter = getTreeNodeAttributes.bind(tree),
        rslt
      ;

      // shared caching node retrival per package instance
      function retrieveOrCloneNode(index) {
        var
          pkgInst = this,
          pkgNodes = pkgInst.nodes
        ;

        // if not a number...
        if (typeof index !== 'number') {
          index = tree.current.index;
        }

        // if there is a cached node...
        if (pkgNodes[index]) {
          // return early, now
          return pkgNodes[index];
        }

        // (otherwise) when the given index is...
        if (
          // outside the range, or...
          index < 0 || index > nodesLn - 1 ||
          // not a whole number...
          ~~index !== index
        ) {
          // exit early as failed request
          return;
        }

        // (otherwise) clone, cache and return a package node
        return pkgNodes[index] =
          mix(
            new panzer.pkgs[pkgInst._pi].node(),
            nodes[index]
          );
      }

      // use nodes as tree
      tree.nodes = nodes;
      // target the first as the current one
      tree.current = nodes[0];

      // create context index for nodes
      tree.ctx = new Array(nodesLn);
      tree.ctx.fill(-1);
      // create last event index for nodes
      tree.lte = new Array(nodesLn);
      tree.lte.fill(-1);

      // fix the `ctx` and `lte` flags of the "null" index
      tree.ctx[0] = 1;
      tree.lte[0] = 0;

      // init event tallies
      tree.et = [
        createEventTally(),   // instance
        new Array(nodesLn),   // node
        0,                    // trip
        0,                    // path
        0                     // leg
      ];

      // compose tree package instances
      tree.pkgs = panzer.pkgs.map(function (panzerPkg, pkgIdx) {
        var
          pkgName = panzerPkg.name,
          pkgDef = panzerPkg.def,
          pkgInst = new pkgDef(),
          // tree package confguration
          treePkg = {
            name: pkgName,
            idx: pkgIdx,
            pkg: panzerPkg,
            inst: pkgInst,
            lock: 0
          },
          pkgProxyInst
        ;

        // define constructor to mirror this package's proxy prototype
        function pkgProxyFn() {}
        pkgProxyFn.prototype = new panzerPkg.proxy();

        // index instances for sharing
        pkgProxyInst =
        pkgProxyKeys[pkgName] =
        treePkg.proxy =
          new pkgProxyFn();
        pkgInstKeys[pkgName] = pkgInst;

        // compose package-proxy
        pkgProxyInst.pkgs = pkgProxyKeys;
        pkgProxyInst.toString = proxyToString;

        // compose package-instance
        pkgInst._pi = pkgIdx;
        pkgInst.pkgs = pkgInstKeys;
        pkgInst.tank = tree.tank;
        pkgInst.proxy = proxy;
        pkgInst.getNode = retrieveOrCloneNode;
        pkgInst.getNodeAttribute = sharedNodeAttrGetter;

        // if this package expects a cloned tree...
        if (panzerPkg.initWithTree) {
          pkgInst.nodes = cloneNodes(nodes, panzerPkg.node);
        } else {
          // init empty tree of nodes
          pkgInst.nodes = new Array(nodesLn);
        }

        return treePkg;
      });

      // allow packages to initialize their classes
      // pass along the init configuration
      rslt = fireTreeEvent(
        tree,         // instance
        INIT,         // event
        [tree.cfg],   // params
        {             // fake tally
          instance: 1,
          node: 1,
          trip: 0,
          path: 0,
          leg: 0
        },
        INIT          // fake event identifier
      );

      // remove config key - no longer needed
      delete tree.cfg;

      // if returned a promise...
      if (isPromise(rslt)) {
        // cleanup fake hold (from `fireEventTree` logic)
        delete tree.holds[INIT];
        // complete initialization later
        rslt.then(function () {
          done(proxy);
        });
      } else {
        // complete initialization now
        done(proxy);
      }

    }

    // get or create package for a Panzer Klass
    function ResolveOrRegisterKlassPackage(pkgName) {
      var
        panzer = this,
        Pkg,
        PkgProxyForKlass,
        PkgNode,
        pkgIdx
      ;

      // if given a valid package name...
      if (typeof pkgName === 'string' && /\w/.test(pkgName)) {

        // create non-existent package
        if (!hasKey(panzer.pkgsIdx, pkgName)) {

          // define a package definition function
          // use to retrieve the package corresponding a proxy instance
          Pkg = function (proxyInst) {
            var tree = is(proxyInst, PkgProxyForKlass) && proxyInst.toString(panzer);
            // if we have a private tree...
            if (tree) {

              // when this package exists, return it's instance
              if (pkgIdx < tree.pkgs.length) {
                return tree.pkgs[pkgIdx].inst;
              }

              // return false when this package was defined
              // after the proxy instance was created
              return false;
            }
          };

          // append method for retrieving super methods
          Pkg.getSuper = panzer.gs;

          // add emitter methods
          Pkg.on = onEventer;
          Pkg.off = offEventer;
          // setup emitter props
          Pkg._evts = {};

          // init package members
          Pkg.attrKey =          // what defines tag/node-attribute
          Pkg.badKey =           // what a node may not be named
          Pkg.prepNode =         // alter a node before compilation
          Pkg.initWithTree =     // clones all nodes before the init event
            0;
          Pkg.allowClone = 1;    // can nodes be cloned or do we force compile?

          PkgProxyForKlass = function() {};
          // extend current public protoype chain
          PkgProxyForKlass.prototype = new panzer.KlassProxy();
          // replace public prototype and expose via this package's proxy member
          panzer.Klass.prototype =
          Pkg.proxy =
            PkgProxyForKlass.prototype;
          // replace public prototype constructor
          panzer.KlassProxy = PkgProxyForKlass;

          // define node constructor for this package
          PkgNode = function () {};
          // expose node prototype
          Pkg.node = PkgNode.prototype;

          // register this package for this panzer, by name and index
          pkgIdx =
          Pkg.index =
          panzer.pkgsIdx[pkgName] =
            panzer.pkgs.push({
              name: pkgName,
              idx: panzer.pkgs.length,
              def: Pkg,
              proxy: PkgProxyForKlass,
              node: PkgNode
            }) - 1;
          // add to list of known packages
          panzer.pkgNames.push(pkgName);
          // capture package definition (for super-prototype lookups)
          panzer.defs.push(Pkg);
        }

        // return package definition
        return panzer.pkgs[panzer.pkgsIdx[pkgName]].def;

      }

      // return existing package names
      return panzer.pkgNames.clone();
    }

    // tests whether this panzer's packages supports cloning nodes
    // used when creating a Tree with a proxy instance
    function allPkgsAllowCloning(panzer) {
      var
        pkgs = panzer.pkgs,
        pkgIdx = pkgs.length
      ;
      while (pkgIdx) {
        if (!pkgs[--pkgIdx].def.allowClone) {
          return 0;
        }
      }
      return 1;
    }

    // copy array of nodes as given object type
    function cloneNodes(nodes, nodeFn) {
      var
        clones = [],
        nodeIdx = nodes.length,
        clone
      ;

      // loop over nodes
      while (nodeIdx) {
        // create package node instance
        clone = new nodeFn();
        // copy the target node to the same index
        clones[--nodeIdx] = mix(clone, nodes[nodeIdx]);
      }

      return clones;
    }

    // queue and run tree navigations
    function runTreeQueue(tree) {

      // if this tree (target) is not queued...
      if (!~treeQueue.indexOf(tree)) {
        // add to queue
        treeQueue.push(tree);
      }

      // if the queue is not executing...
      if (!treeQueueRunning) {
        treeQueueRunning = 1;
        while (treeQueue.length) {
          treeQueue.shift().go();
        }
        treeQueueRunning = 0;
      }

    }

    function tankStop() {
      var tree = this;

      // if in loop and the current package is unlocked...
      if (tree.loop) {
        // return result of attempting to lock the tree
        return !!tree.lock();
      }
    }

    // go to the existing/new navigation target
    function tankGo(tgtIndex) {
      var
        tree = this,
        tank = tree.tank,
        tgtNode
      ;

      // exit early, when...
      if (
        // given an argument...
        arguments.length && (
          // that is not a number...
          typeof tgtIndex !== 'number' ||
          // or is not a node index...
          !(tgtNode = tree.nodes[tgtIndex])
        )
      ) {
        return;
      } else if (tgtNode) {
        // otherwise, use the node as a new target
        tree.target = tgtNode;
        // update public tank property
        tree.tank.targetIndex = tgtNode.index;
      }

      // increment navigation call count
      tank.gc = ++tree.gc;

      // if in loop and this package is locked...
      if (tree.loop) {
        // unlock tree
        tree.unlock();
      }

      tree.go();

      // return promise?
    }

    function tankQueue() {

    }

    // private Tree instance
    function Tree(panzer, proxy, source, config, proxyToString, done) {
      var
        tree = this,
        nodeIdx = 0,
        nodes,
        nodesLn,
        origTree
      ;

      // instance identifier
      tree.id = panzer.id + '-' + panzer.cnt + '-' + klassInstCnt;
      // number of calls for this tree to navigate
      tree.gc =
      // flag for when navigation should stop
      tree.stop =
      // trip count
      tree.tc =
      // loop count
      tree.lc =
      // instruction count
      tree.ic =
        0;
      // capture tree config - deleted after "init" event
      tree.cfg = config;
      // alias panzer
      tree.pzr = panzer;
      // alias public proxy instance
      tree.pxy = proxy;

      // init package loop locks
      tree.locks = new Array(panzer.pkgs.length);

      // init node event holds
      tree.holds = {};

      // privileged (package) api for controlling this tank
      tree.tank = {
        id: tree.id,
        // the number of calls to go
        // mirrors `tree.gc`
        gc: 0,
        currentIndex: 0,
        targetIndex: -1,

        // direct tank to a node
        go: tankGo.bind(tree),

        // stop the tank
        stop: tankStop.bind(tree),

        // navigate after the current navigation successfully completes
        postHost: function (tgtIndex) {
          if (treeChain.length && tree.nodes[tgtIndex]) {
            tree.after(tgtIndex);
          }

          // return promise?
        }

        // get node attributes??
        // attr: tankAttr.bind(tree)
        // get copy of node?
        // node: tankNode.bind(tree)

      };

      // add tree-bound toString method to the proxy
      proxy.toString = proxyToString.bind(tree);

      // if the source is a proxy that we can copy...
      if (
        // raw object is a proxy instance
        is(source, panzer.Klass) &&
        // the private tree instance exists
        is((origTree = source.toString(panzer)), Tree) &&
        // the number of packages hasn't changed
        panzer.pkgs.length == origTree.pkgs.length &&
        // all packages allow cloning their nodes
        allPkgsAllowCloning(panzer)
      ) {

        // reference the original tree's source value
        tree.raw = origTree.raw;

        // copy compiled nodes - use basic Object constructor
        tree.nodes =
        nodes =
          cloneNodes(origTree.nodes, Object);

        nodesLn = nodes.length;

        // finish initialization
        completeTreeInit(tree, done);

      } else {

        // capture the source
        tree.raw = source;

        // compile nodes
        compileNodes(tree, source, done);
      }

    }

    Tree.prototype = {

      tally: function (eventIndex) {
        var
          tree = this,
          tallies = tree.et,
          nodeIndex = tree.current.index
        ;

        return {
          // total occurences for instance
          instance: tickEventTally(tallies[0], eventIndex),
          // total occurences for node
          node: tickNodeEventTally(tallies[1], nodeIndex, eventIndex),
          // total occurences for trip
          trip: tickEventTally(tallies[2], eventIndex),
          // total occurences for path in trip (across legs)
          path: tickNodeEventTally(tallies[3], nodeIndex, eventIndex),
          // total occurences for leg of trip
          leg: tickEventTally(tallies[4], eventIndex)
        };
      },

      // lock package and increment tree.stop
      // only called during loop
      lock: function () {
        var
          tree = this,
          pkgLocks = tree.locks,
          pkgIdx = tree.pkgIdx
        ;

        // if not locked...
        if (!pkgLocks[pkgIdx]) {
          // lock this package
          tree.locks[pkgIdx] = 1;
          // increment stop flag
          tree.stop += pkgIdx + 1;

          // flag success locking
          // return used by `tankStop()`
          return 1;
        }
      },

      // unlock package and decrement tree.stop
      // only called during loop
      unlock: function () {
        var
          tree = this,
          pkgLocks = tree.locks,
          pkgIdx = tree.pkgIdx
        ;

        // if locked...
        if (pkgLocks[pkgIdx]) {
          // unlock this package
          pkgLocks[pkgIdx] = 0;
          // decrement stop flag
          tree.stop -= pkgIdx + 1;
        }
      },
/*
      // navigate towards a target node
      go: function () {
        var
          tree = this,
          nodes = tree.nodes,
          tank = tree.tank,
          clearStack,
          postId,
          hostTree,
          dir,
          inCurrentNode,
          traversalCount = 0,
          resuming = tree.stopped,
          curNode = tree.current,
          curIndex = curNode.index,
          nextPhase = resuming ? tree.lte[curIndex] : -1,
          nextNodeIndex = -1,
          lastTargetIndex = resuming ? tree.target.index : null,
          nodeEngaged,
          endEventFired
        ;

        // exit when already looping
        if (tree.loop) {
          return !!tree.target;
        }

        // if this tree has a stack and the event stack is empty...
        if (tree.stack && !eventStack.length) {
          // set event stack to the tree's stack
          eventStack = tree.stack;
          // flag that the stack needs to be removed later
          clearStack = 1;
        }

        // reset loop flags
        tree.loop = 1;
        tree.stop = 0;
        // reset package locks
        tree.locks = [];

        while (tree.loop) {

          // if stopped or no target...
          if (tree.stop || !tree.target) {

            if (firedMoveEvent) {
              firedMoveEvent = 0;
              tree.fire('idle');
              continue;
            }

            if (firedBeginEvent) {
              firedBeginEvent = 0;
              tree.fire('end');
              continue;
            } else {

              // flag to resume on next navigation, or not
              tree.stopped = tree.target;

              // we're outta here!
              tree.loop = 0;
              continue;
            }

          } else {

            // (otherwise) if not stopped or we have a target...

            // navigation logic and events

            if (tree.target) {

              if (!firedMoveEvent) {
                firedMoveEvent = 1;
                tree.fire('move');
                continue;
              }

              // if we have a next phase...
              if (~nextPhase) {

              }

              // if we have a next node...
              if (~nextNodeIndex) {
                if (curNode.ctx)
              }

              // when...
              if (
                // new node target
                lastTargetIndex !== tree.target.index ||
                // no next phase or node
                !(~nextPhase | ~nextNodeIndex)
              ) {
                // calculate next navigation step
                // should result in a phase or node move
              }

              //
              if () {

              }

              if (firedEngageEvent) {
                firedEngageEvent = 0;
                tree.fire('release');
                continue;
              }

            }

          }
        }












        // navigate towards the target node, until stopped
        while (tree.loop) {
          if ((resuming || tree.target) && !tree.stop) {
            endEventFired = 0;
            if (lastTargetIndex != tree.target.index || !(~nextPhase | ~nextNodeIndex)) {

              // reset tracking variables
              inCurrentNode = tree.ctx[curIndex] === 1;
              nextPhase = nextNodeIndex = -1;
              lastTargetIndex = tree.target.index;
              dir = lastTargetIndex - curIndex;

              // determine where to navigate next
              if (dir) {
                if ((dir > 0 && curIndex < 2) || !tree.target.path.indexOf(curNode.path)) {
                  if (inCurrentNode) {
                    // change to first child node
                    nextNodeIndex = curNode.firstChildIndex;
                  } else {
                    // traverse into the current node
                    nextPhase = 1;
                  }
                } else {
                  if (inCurrentNode) {
                    // traverse out of the current node
                    nextPhase = 2;
                  } else {
                    if (tree.target.path.indexOf(nodes[curNode.parentIndex].path)) {
                      // reverse direction (in order to exit a branch)
                      dir = -1;
                    }
                    if (dir > 0) {
                      if (tree.lte[curIndex] == 3 || tree.lte[curIndex] == 2) {
                        // change to next sibling node
                        nextNodeIndex = curNode.nextIndex;
                      } else {
                        // traverse over the current node
                        nextPhase = 3;
                      }
                    } else {
                      if (tree.lte[curIndex] == 4 || tree.lte[curIndex] == 2) {
                        // change to previous sibling node, if not the parent node
                        nextNodeIndex = ~curNode.previousIndex ? curNode.previousIndex : curNode.parentIndex;
                      } else {
                        // traverse backwards, over the current node
                        nextPhase = 4;
                      }
                    }
                  }
                }
              } else {
                // traverse into or on the current node
                nextPhase = inCurrentNode ? 0 : 1;
              }
            } else if (~nextNodeIndex) {
              // change - after disengaging - the current node
              if (nodeEngaged) {
                nodeEngaged = 0;
                tree.fire('release');
              } else {
                tank.currentIndex = nextNodeIndex;
                tree.fire('node', nextNodeIndex, curIndex);
                tree.lte[curIndex] = 0;
                curNode =
                tree.current =
                  nodes[nextNodeIndex];
                curIndex = nextNodeIndex;
                nextNodeIndex = -1;
              }
            } else if (!nodeEngaged) {
                // engage the current node
                nodeEngaged = 1;
                tree.fire('engage');
            } else if (!inCurrentNode && !resuming && (nextPhase == 1 || nextPhase == 2)) {
              if (nextPhase == 2) {
                // clear target phase
                nextPhase = -1;
              } else {
                // enter the current node
                inCurrentNode = tree.ctx[curIndex] = 1;
              }
            } else {
              traversalCount++;
              if (resuming) {
                tree.fire('traversing', nextPhase);
              } else {
                tree.lte[curIndex] = nextPhase;

                // reset flags when traversing "on" the current node
                if (!nextPhase) {
                  tree.target = 0;
                  tank.targetIndex = -1;
                }

                tree.fire('traverse', nextPhase);
              }

              traversalCount++;

              if (!tree.stop) {
                // end uninterupted traversal event
                tree.fire('traversed', nextPhase);
                tree.stopped = 0;
              }
              // flag stopped traversals (allows stopping during "traversed" event as well)
              tree.stopped = tree.stop;
              resuming = 0;

              if (nextPhase == 2) {
                // exit the current node
                inCurrentNode = tree.ctx[curIndex] = 0;
              } else {
                nextPhase = -1;
              }
            }
          } else if (nodeEngaged) {
            // release this node
            nodeEngaged = 0;
            tree.fire('release');
          } else if (!endEventFired) {
            // end navigation
            endEventFired = 1;
            tree.fire('end');
          } else {
            // end loop
            tree.loop = 0;
          }
        }

        if (clearStack) {
          // clear when the stack came from this tree stack
          eventStack = [];
        }

        return traversalCount;
      },

*/
      // index promises with the node index, event, and params
      hold: function (evt, params, promises) {
        var
          tree = this,
          holds = tree.holds,
          holdId = evt.index + evt.type + params,
          randomValue = Math.random()
        ;
        // set key for hold
        holds[holdId] = randomValue;
        // return promise that removes hold
        return Promise.all(promises)
          .then(function () {
            // TOO DEFENSIVE???
            // UNSURE HOW THIS WOULD NOT BE THE SAME HOLD
            // if this is the same hold...
            if (holds[holdId] === randomValue) {
              // remove it
              delete holds[holdId];
            }
          });
      },

      // invoke package event handlers
      // return true when the event is not stopped or held
      fire: function (eventIndex, params) {
        var
          tree = this,
          curNode = tree.current,
          curIndex = curNode.index,
          eid = '' + curIndex + eventIndex + params,
          wasHeld = hasKey(tree.holds, eid),
          rslt
        ;

        // if there is a hold on this node...
        if (wasHeld) {
          // intercept the hold
          rslt = fireTreeEvent(
            tree,
            INTERCEPT,
            [
              curNode.path,
              {
                type: eventNameMap[eventIdx],
                params: params
              },
              tree.holds[eid][0].concat()
            ],
            tree.tally(INTERCEPT),
            eid
          );

          // if the intercept result is a promise...
          if (isPromise(rslt)) {
            // follow up with continuation on resolve
            rslt.then(function () {
              // discard the hold
              delete tree.holds[eid];
              // if conditions allow for resuming...
              if (
                // we have a target
                tree.target &&
                // we're on the same node
                curIndex === tree.current.index &&
                // target is on/within our path
                !tree.target.path.indexOf(tree.current.path)
              ) {
                // resume navigation
                tree.go();
              }
            });
            // exit function
            return;
          } else if (
            // if no result is `false`
            rslt.every(resultIsNotfalse) &&
            // at least one is `true`
            rslt.some(resultIsTrue)
          ) {
            // remove hold on this event
            delete tree.holds[eid];
          } else {
            // skip when the result isn't definitive
            // this honors the hold
            return;
          }
        }

        // increment event index, when...
        if (
          // there was a hold or navigation had been stopped
          wasHeld || tree.stopped &&
          // this is a traverse, scope, or switch event
          eventIndex > END
        ) {
          // bump to corresponding  "xyz-resume" event's index
          eventIndex++;
        }

        // fire the target event
        rslt = fireTreeEvent(
          tree,
          eventIndex,
          params,
          tree.tally(eventIndex),
          eid
        );

        // flag success when not stopped and no hold
        return !tree.stop && !hasKey(tree.holds, eid);
      }

    };

    // return module namespace
    return {
      // public method to return a Panzer class
      create: function () {
        var
          // platform configuration
          panzer = {
            // unique id for this klass
            id: ++klassId,
            // number of klass instances
            cnt: 0,
            // collection package references
            pkgs: [],
            // collection of packages keyed by name
            pkgsIdx: {},
            // collection of package names
            pkgNames: [],
            // collection of package definition functions
            defs: [],
            // constructor for public instances
            KlassProxy: function () {},
            Klass: Klass,
            // shared package-definition method
            // to get next method up the prototype chain
            gs: function (methodName) {
              var
                pkgEntryIdx,
                pkgInst
              ;
              // if given a valid string...
              if (isFullString(methodName)) {
                // search for matching "this" - the package definition
                pkgEntryIdx = panzer.defs.indexOf(this);
                // if this definition function is registered...
                if (~pkgEntryIdx) {
                  // create corresponding proxy instance
                  pkgInst = new panzer.pkgs[pkgEntryIdx - 1].proxy();
                  // if method is in the prototype (from this link in the chain)...
                  if (isFunction(pkgInst[methodName])) {
                    // return the matching method
                    return pkgInst[methodName];
                  }
                }
              }

              // (otherwise) return an empty function for continuity purposes
              return function () {};
            }
          }
        ;

        // shared and bound by Tree instances
        function proxyToString(platform) {
          // if this is an internal call...
          if (platform === panzer) {
            return this;
          }

          // emulate normal toString behavior
          return ObjectToStringResult;
        }

        function Klass(source, config) {
          var
            inst = this,
            done
          ;

          // if called without `new`...
          if (!is(inst, Klass)) {
            return (new Klass(source, config)).ready;
          }

          // increment Klass instance count
          panzer.cnt++;
          // increment Panzer instance count
          klassInstCnt++;

          // capture promise that delivers this instance
          inst.ready = new Promise(function (resolve) {
            // capture resolve function
            done = resolve;
          });

          // init proxy packages
          inst.pkgs = {};

          // if there are packages...
          if (panzer.pkgs.length) {
            // define private & package instances
            new Tree(
              panzer,
              inst,
              source,
              (isNotNullOrUndefined(config)) ? config : {},
              proxyToString,
              done
            );
          } else {
            // resolve now
            // no functionality means no need to compile nodes
            done(inst);
          }

        }
        Klass.prototype = panzer.KlassProxy.prototype;

        // flag the id of this klass
        Klass.id = klassId;

        // Klass package manager
        Klass.pkg = ResolveOrRegisterKlassPackage.bind(panzer);

        return Klass;
      },
      version: '0.4.0'
    };
  }

  // initialize Panzer, based on the environment
  if (inAMD) {
    define(initPanzer);
  } else if (inCJS) {
    module.exports = initPanzer();
  } else if (!scope.Panzer) {
    scope.Panzer = initPanzer();
  }
}(
  typeof define == 'function',
  typeof exports != 'undefined',
  Object, RegExp, Promise, this
);
