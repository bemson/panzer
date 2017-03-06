/*!
 * Panzer v0.4.0
 * http://github.com/bemson/Panzer
 *
 * Copyright 2012, Bemi Faison
 * Released under the MIT License
 */
!function (inAMD, inCJS, Array, Object, RegExp, Error, Promise, scope, undefined) {

  // dependent module initializer
  function initPanzer() {
    var
      hasKey = Function.prototype.call.bind(Object.prototype.hasOwnProperty),
      panzerEventCount = 0,
      klassId = 0,
      klassInstCnt = 0,
      eventStack = [],
      ObjectToStringResult = ({}).toString(),
      isArray = Array.isArray,
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
      nodeSwitchMap = [
        'parentIndex',
        'firstChildIndex',
        'nextIndex',
        'previousIndex'
      ],
      INTERCEPT = 0,
      BEGIN = 1,
      MOVE = 2,
      ENGAGE = 3,
      RELEASE = 4,
      IDLE = 5,
      END = 6,
      SWITCH = 7,
      SCOPE = 9,
      TRAVERSE = 11,
      INIT = 13,
      moveSwitchParent = 1,
      moveSwitchFirstChild = 2,
      moveSwitchRightSibling = 3,
      moveSwitchLeftSibling = 4,
      moveTraverseOn = 5,
      moveTraverseIn = 6,
      moveTraverseOut = 7,
      moveTraverseOver = 8,
      moveTraverseBover = 9,
      moveScopeOut = 10,
      moveScopeIn = 11
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

      if (isFunction(callback)) {
        if (isArray(evt)) {
          evt.forEach(function (e) {
            onEventer.call(me, e, callback);
          });
        } else if (isFullString(evt)) {
          if (!hasKey(me._evts, evt)) {
            // init event queue
            me._evts[evt] = [];
          }
          // add callback to event queue
          me._evts[evt].push(callback);
        }
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

      if (!argLn || !hasKey(me, '_evts')) {
        // reset if clearing all events
        me._evts = {};
      } else if (isArray(evt)) {
        evt.forEach(function (e) {
          offEventer.call(me, e, callback);
        });
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

    function fireTreeEvent(tree, eventIndex, params, tally) {
      var
        eventName = eventNameMap[eventIndex],
        alreadyBlocked = !!isBlocked(tree),
        eventObj = {
          // identifier of this event across all Panzer Klass events
          id: ++panzerEventCount,
          // number of this event for the instance
          order: ++tree.en,
          // id of the corresponding tank
          tid: tree.id,
          // count of this journey
          trip: tree.tc,
          // count of legs in this journey
          leg: tree.lc,
          // source instruction count
          command: tree.cc,
          // the event type
          type: eventName,
          // the index of this event
          index: tree.current.index,
          // the path of this event
          path: tree.current.path,
          // the depth of this event
          depth: tree.current.depth,
          // snap the event stack
          stack: eventStack.concat(),
          // the proxy instance corresponding this event
          proxy: tree.pxy,
          // event counts
          tally: tally,
          // event history
          trail: tree.trail.concat()
        },
        fnResults = [],
        pkgs = tree.pkgs,
        pkgIdx = 0,
        promising = 0,
        promise,
        pkgEntry,
        pkgDef,
        fns,
        fnsLn,
        fnIdx,
        fnResult
      ;

      // prepend this event to the stack
      eventStack.unshift(eventObj);
      // prepend event to params
      params.unshift(eventObj);
      // add to trail for next event
      tree.trail.unshift(eventObj);

      // with each tree package...
      for (; pkgEntry = pkgs[pkgIdx]; pkgIdx++) {

        // alias the (public) package definition
        pkgDef = pkgEntry.pkg.def;

        // if this event is registered...
        if (hasKey(pkgDef._evts, eventName)) {

          // copy the callback queue
          fns = pkgDef._evts[eventName].concat();

          // get number of callbacks
          fnsLn = fns.length;

          // capture and expose the package instance
          tree.pkg = pkgEntry.inst;

          // expose active package name
          tree.pkgName = pkgEntry.name;

          // expose index of the active package
          // used by tanks calls
          tree.pkgIdx = pkgIdx;

          // with each package callback...
          for (fnIdx = 0; fnIdx < fnsLn; fnIdx++) {
            // invoke and capture the return value
            fnResults[fnResults.length] =
            fnResult =
              fns[fnIdx].apply(pkgEntry.inst, params);

            // update event when...
            if (
              // the result is our first promise, or ...
              (
                !promising &&
                typeof fnResult === 'object' &&
                (promising = isPromise(fnResult))
              ) ||
              // we're newly blocked...
              (!alreadyBlocked && isBlocked(tree))
            ) {
              // flag that we're blocked
              alreadyBlocked =
              // update `blocked` flag
              tree.tank.blocked =
                true;
              // force stop the tree
              ++tree.stop;
            }
          }
        }
      }

      // remove this event from the stack
      eventStack.shift();

      // if at least one promise was returned...
      if (promising) {
        // create summary promise
        promise = Promise.all(fnResults);
        // block navigation
        tree.tank.block(promise, true);
        // return summary promise
        return promise;
      }

      // (otherwise) just return the results
      return fnResults;
    }

    // NAVIGATION

    function isBlocked(tree) {
      var
        blocks = tree.b,
        curIdx = tree.current.index,
        nxtIdx
      ;

      // return truthy when this node has a block, or ...
      return blocks[curIdx] ||
        // the next node is blocked (if any)
        (~(nxtIdx = getNextIndex(tree)) ? blocks[nxtIdx] : false);
    }

    function getSwitchIndex(node, nextMove) {
      return node[nodeSwitchMap[nextMove - 1]];
    }

    function getNextIndex(tree, curIdx, tgtIdx) {
      var
        argLn = arguments.length,
        nodes = tree.nodes,
        // start from having landed on the current index
        nextMove = moveTraverseOn,
        curNode
      ;

      // if no current index...
      if (argLn < 2) {
        // use current node's index
        curIdx = tree.current.index;
        // if no target index...
        if (argLn < 3) {
          // exit early, if no target...
          if (!tree.target) {
            return -1;
          }
          // use the target node's index
          tgtIdx = tree.target.index;
        }
      }

      // exit early, if indexes are the same
      if (curIdx === tgtIdx) {
        return -1;
      }

      curNode = nodes[curIdx];
      tgtNode = nodes[tgtIdx];

      // step until we have a switch move
      while (nextMove > moveSwitchLeftSibling) {
        nextMove = calcNextMove(nodes, curNode, tgtNode, nextMove);
      }

      return getSwitchIndex(curNode, nextMove);
    }

    function getNextMove(tree) {
      return calcNextMove(
        tree.nodes,
        tree.current,
        tree.target,
        tree.lastMove
      );
    }

    function calcNextMove(nodes, curNode, tgtNode, lastMove) {
      var
        tgtIdx = tgtNode.index,
        curIdx = curNode.index,
        tgtPath = tgtNode.path,
        nextMove
      ;

      // if on the target node...
      if (curIdx === tgtIdx) {

        if (
          lastMove === moveSwitchParent ||
          lastMove === moveTraverseIn ||
          lastMove === moveTraverseOn
        ) {
          nextMove = moveTraverseOn;
        } else {
          nextMove = headIn(lastMove);
        }

      } else if (curIdx && tgtIdx) { // if the current and target nodes are not null...

        // if the target does not contain the current path...
        if (tgtPath.indexOf(curNode.path)) {
          // if the target does not contain the parent's path...
          if (tgtPath.indexOf(nodes[curNode.parentIndex].path)) {
            nextMove = navUp(lastMove);
          } else {
            if (tgtIdx > curIdx) {
              nextMove = navRight(lastMove);
            } else {
              nextMove = navLeft(lastMove);
              if (
                nextMove === moveSwitchLeftSibling &&
                !curNode.childIndex
              ) {
                nextMove = moveSwitchParent;
              }
            }
          }
        } else {
          // when the target contains the current path
          nextMove = navDown(lastMove);
        }

      } else if (tgtIdx) { // when the current node is the null node...
        nextMove = navDown(lastMove);
      } else { // when the target node is the null node...
        nextMove = navUp(lastMove);
      }

      return nextMove;
    }

    function headIn(lastMove) {
      var nextMove;

      if (
        // just scoped out
        lastMove === moveScopeOut ||
        // some switch event
        lastMove < moveTraverseOn
      ) {
        nextMove = moveScopeIn;
      } else if (
        // just traversed out
        lastMove === moveTraverseOut ||
        // just scoped in
        lastMove === moveScopeIn
      ) {
        nextMove = moveTraverseIn;
      }

      return nextMove;
    }

    function headOut(lastMove) {
      var nextMove;

      if (
        lastMove === moveTraverseIn ||
        lastMove === moveTraverseOn ||
        lastMove === moveSwitchParent
      ) {
        nextMove = moveTraverseOut;
      } else if (
        lastMove === moveTraverseOut ||
        lastMove === moveScopeIn
      ) {
        nextMove = moveScopeOut;
      }

      return nextMove;
    }

    function navUp(lastMove) {
      var nextMove;

      if (
        lastMove === moveScopeOut ||
        lastMove === moveSwitchFirstChild ||
        lastMove === moveTraverseBover
      ) {
        nextMove = moveSwitchParent;
      } else {
        nextMove = headOut(lastMove);
      }

      return nextMove;
    }

    function navDown(lastMove) {
      var nextMove;

      if (
        lastMove === moveTraverseIn ||
        lastMove === moveTraverseOn
      ) {
        nextMove = moveSwitchFirstChild;
      } else {
        nextMove = headIn(lastMove);
      }

      return nextMove;
    }

    function navLeft(lastMove) {
      var nextMove;

      if (
        lastMove === moveTraverseOver ||
        lastMove === moveSwitchLeftSibling
      ) {
        nextMove = moveTraverseBover;
      } else if (
        lastMove === moveTraverseBover ||
        lastMove === moveScopeOut ||
        lastMove === moveSwitchParent
      ) {
        nextMove = moveSwitchLeftSibling;
      } else {
        nextMove = headOut(lastMove);
      }

      return nextMove;
    }

    function navRight(lastMove) {
      var nextMove;

      if (
        lastMove === moveTraverseBover ||
        lastMove === moveSwitchRightSibling ||
        lastMove === moveSwitchFirstChild
      ) {
        nextMove = moveTraverseOver;
      } else if (
        lastMove === moveTraverseOver ||
        lastMove === moveScopeOut ||
        lastMove === moveSwitchParent
      ) {
        nextMove = moveSwitchRightSibling;
      } else {
        nextMove = headOut(lastMove);
      }

      return nextMove;
    }

    // DOMAIN

    // returns the tree instance
    function getTree(obj) {
      var tree = obj && hasKey(obj, 'toString') && obj.toString();

      // if this is a tree instance...
      if (tree && is(tree, Tree)) {
        return tree;
      }
    }

    function reportCompletion(tree) {
      var
        instructions = tree.ics,
        current = tree.current.index,
        i = 0,
        j = instructions.length,
        instruction
      ;
      // clear tree instructions
      tree.ics = [];

      for (; i < j; i++) {
        instruction = instructions[i];
        // add flag if the target was met
        instruction.o.success = current === instruction.o.to;
        // resolve the pending promise with report
        instruction.r(instruction.o);
      }
    }

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

    function getInitialNodes(source) {
      var
        nullNode = initTreeNodeMembers({}),
        rootNode = initTreeNodeMembers({})
      ;

      nullNode.name = 'PNULL';
      nullNode.path = '..//';
      nullNode.children[0] = 1;
      nullNode.parentIndex = -1;

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

      function resolveNodeValue(val) {
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
              val,                // node value
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
        node.index = nodes.push(node) - 1;

        if (!parent.children.length) {
          parent.firstChildIndex = node.index;
        }
        node.childIndex = parent.children.push(node.index) - 1;
        parent.lastChildIndex = node.index;

        // update younger sibling
        if (node.childIndex) {
          node.previousIndex = parent.children[node.childIndex - 1];
          nodes[node.previousIndex].nextIndex = node.index;
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
        nodesLn = nodes.length,
        proxy = tree.pxy,
        rslt
      ;

      // use nodes as tree
      tree.nodes = nodes;
      // target the first as the current one
      tree.current = nodes[0];

      // init event tallies
      tree.et = [
        createEventTally(),   // instance
        new Array(nodesLn),   // node
        0,                    // trip
        0,                    // path
        0                     // leg
      ];

      // init blocked nodes indice
      tree.b = new Array(nodesLn);
      // zero out block counts
      tree.b.fill(0);
      // init shared nodes index
      tree.sN = new Array(nodesLn);

      // clone nodes for this package
      tree.pkgs.forEach(function (treePkg) {
        treePkg.inst.nodes = cloneNodes(nodes);
      });

      // allow packages to initialize their classes
      // pass along the init configuration
      rslt = fireTreeEvent(
        tree,         // instance
        INIT,         // event
        [tree.j],     // params - the user's package config object
        {             // fake tally
          proxy: 1,
          node: 1,
          trip: 0,
          path: 0,
          leg: 0
        }
      );

      // delete "junk" key - now that we're initialized
      delete tree.j;

      // if returned a promise...
      if (isPromise(rslt)) {
        // complete initialization later
        rslt.then(function () {
          // flag that tree is ready
          tree.ret = 'now';
          // fulfill initialization promise
          done(proxy);
        });
      } else {
        // flag that tree is ready
        tree.ret = 'now';
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
        pkgIdx
      ;

      // if passed anything...
      if (arguments.length) {

        // if given a valid package name...
        if (typeof pkgName === 'string' && /\w/.test(pkgName)) {

          // create non-existent package
          if (!hasKey(panzer.pkgsIdx, pkgName)) {

            // define a package definition function
            // use to retrieve the package corresponding a proxy, package, or tank instance
            Pkg = function (obj) {
              var tree;

              // if invoked with new...
              if (is(this, Pkg)) {
                // exit early
                return;
              }

              // extract private tree from object
              tree = getTree(obj);

              // when we have a tree with this package, from the same Klass...
              if (tree &&
                tree.pkgs &&
                pkgIdx < tree.pkgsLn &&
                tree.pzr === panzer &&
                tree.ret === 'now'
              ) {
                // return the corresponding instance
                return tree.pkgs[pkgIdx].inst;
              }

              // otherwise return false
              return false;
            };

            // append method for retrieving super methods
            Pkg.getSuper = panzer.gs;

            // add emitter methods
            Pkg.on = onEventer;
            Pkg.off = offEventer;
            // setup emitter props
            Pkg._evts = {};

            // init static package members
            Pkg.attrKey =          // what defines tag/node-attribute
            Pkg.badKey =           // what a node may not be named
            Pkg.prepNode =         // alter a node before compilation
            Pkg.prebake =          // clones all nodes before the init event
              0;
            Pkg.cloneable = 1;     // can nodes be cloned or do we force compile?

            PkgProxyForKlass = function() {};
            // extend current public protoype chain
            PkgProxyForKlass.prototype = new panzer.KlassProxy();
            // replace public prototype and expose via this package's proxy member
            panzer.Klass.prototype =
            Pkg.klassFn =
              PkgProxyForKlass.prototype;
            // replace public prototype constructor
            panzer.KlassProxy = PkgProxyForKlass;

            // register this package for this panzer, by name and index
            pkgIdx =
            Pkg.index =
            panzer.pkgsIdx[pkgName] =
              panzer.pkgs.push({
                name: pkgName,
                idx: panzer.pkgs.length,
                def: Pkg,
                proxy: PkgProxyForKlass
              }) - 1;
            // add to list of known packages
            panzer.pkgNames.push(pkgName);
            // capture package definition (for super-prototype lookups)
            panzer.defs.push(Pkg);
          }

          // return package definition
          return panzer.pkgs[panzer.pkgsIdx[pkgName]].def;

        }

        // otherwise, throw
        throw new Error('invalid package name');
      }

      // return existing package names
      return panzer.pkgNames.concat();
    }

    // tests whether this panzer's packages supports cloning nodes
    // used when creating a Tree with a proxy instance
    function allPkgsAllowCloning(panzer) {
      var
        pkgs = panzer.pkgs,
        pkgIdx = pkgs.length
      ;
      while (pkgIdx) {
        if (!pkgs[--pkgIdx].def.cloneable) {
          return 0;
        }
      }
      return 1;
    }

    // copy array of nodes as given object type
    function cloneNodes(nodes) {
      var
        nodeIdx = nodes.length,
        clones = new Array(nodeIdx)
      ;

      // loop over nodes
      while (nodeIdx) {
        // copy the target node at the same index
        clones[--nodeIdx] = mix({}, nodes[nodeIdx]);
      }

      return clones;
    }

    // throws when the given index is invalid
    function validateIndexOrThrow(nodes, index) {
      // if index is a number in nodes...
      if (typeof index === 'number' && hasKey(nodes, index)) {
        // return the index
        return index;
      }

      throw new Error('invalid index "' + index + '"');
    }

    function tankStop() {
      var tree = this;

      // if loop is active...
      if (tree.loop) {
        // return result of attempting to lock the tree
        return tree.lock();
      }

      return false;
    }

    function getTankInstruction(tree, setTarget, tgtIndex) {
      var
        tank = tree.tank,
        target
      ;

      // if given an index is not the eventStack...
      if (setTarget) {
        // check node index
        tgtIndex = validateIndexOrThrow(tree.nodes, tgtIndex);

        // capture the target index
        // otherwise, use the node as a new target
        target =
        tree.target =
          tree.nodes[tgtIndex];

        // update public tank property
        tank.target = tgtIndex;
      } else {
        // capture current tree target - if any
        target = tree.target;
      }

      // increment instruction count
      tank.cc = ++tree.cc;

      // return promise
      return new Promise(function (resolve) {
        // capture instruction
        tree.ics.push({
          // output object
          o: {
            id: tree.cc,
            from: tree.current.index,
            to: target ? target.index : -1
          },
          // capture resolver
          // invoked, once tree completes navigation
          r: resolve
        });
      });
    }

    // go to the existing/new navigation target
    function tankGo(tgtIndex) {
      var
        tree = this,
        promise = getTankInstruction(tree, arguments.length, tgtIndex)
      ;

      // take go action for this tree
      // depends on whether tree is initialized or not
      // avoids need for `if` statement
      tree[tree.ret]();

      return promise;
    }

    // causes this instance to wait for the given instance to complete navigating
    function tankQueue(inst, tgtIndex) {
      var
        tree = this,
        tid = tree.id,
        instQ,
        promise
      ;

      // attempt to retrieve tree instance from argument
      inst = getTree(inst);

      // if the first argument is not a tree...
      if (!inst) {
        throw new Error('invalid queue target');
      }

      // get tank instruction for same or new target
      promise = getTankInstruction(tree, arguments.length > 1, tgtIndex);

      // alias the target instance's queue
      instQ = inst.qe;

      // if not cued...
      if (!hasKey(instQ, tid)) {
        // add tree to target's queuees
        instQ[tid] = tree;
        instQ.push(tree);
        // add the target to this tree's queue
        tree.q[inst.id] = inst;
        // increment ourcount of who we're waiting on
        tree.q.push(inst);
        // update tank
        tree.tank.queued = true;
        // stop navigation
        tree.stop++;
      }

      return promise;
    }

    // block the given/implied node(s)
    function tankBlock(promise, tgts) {
      var
        tree = this,
        nodes = tree.nodes,
        argLn = arguments.length,
        curIdx = tree.current.index,
        blocks = tree.b
      ;

      function doneBlocking() {
        var released = tgts.filter(function (index) {
          // capture newly freed nodes
          return blocks[index] && !--blocks[index];
        });

        if (!isBlocked(tree)) {
          tree.tank.blocked = false;
        }

        return released;
      }

      // throw when...
      if (
        // no agurm, or...
        !argLn ||
        // first argument is not a promise...
        !isPromise(promise)
      ) {
        throw new Error('missing promise');
      }

      // if there are tgts to resolve
      if (argLn > 1) {
        // if `true`...
        if (tgts === true) {

          // block the current node when...
          if (
            // out of the loop, or...
            !tree.loop ||
            // there is no target
            !tree.target ||
            // the target is same as the current node
            tree.target.index === curIdx
          ) {
            // block the current node
            tgts = [curIdx];
          } else {
            // target the next node
            tgts = [getNextIndex(tree)];
          }
        } else {

          // if not an array...
          if (!isArray(tgts)) {
            // make an array
            tgts = [tgts];
          }
          // validate and copy all indice
          tgts = tgts.map(validateIndexOrThrow.bind(0, nodes));
        }

      } else {
        // target the current index
        tgts = [curIdx];
      }

      // block the targeted node(s)
      tgts.forEach(function (tgtIdx) {
        ++blocks[tgtIdx];
      });

      // if now blocking the current or upcoming node...
      if (isBlocked(tree)) {
        // stop the tank
        ++tree.stop;
        // update tank property
        tree.tank.blocked = true;
      }

      // when the promise...
      return promise.then(
        // ...fulfills
        function () {
          var released = doneBlocking();

          // resume navigation when...
          if (
            // there is a target, and...
            tree.target &&
            // we're not blocked...
            !tree.tank.blocked &&
            // we're not waiting on another instance
            !tree.q.length
          ) {
            // resume navigating
            tree.go();
          }

          // return report object
          return {
            from: curIdx,
            blocked: tgts,
            released: released
          };
        },
        // ...rejects
        function (e) {
          // release nodes
          doneBlocking();

          // if already given an error...
          if (is(e, Error)) {
            // re-throw same error
            throw e;
          }

          // otherwise, throw new Error with whatever we have
          throw new Error(e);
        }
      );
    }


    // private Tree instance
    function Tree(panzer, proxy, source, config, proxyToString, done) {
      var
        tree = this,
        pkgInstKeys = {},
        origTree
      ;

      // pre-bind shared toString method
      proxyToString = proxyToString.bind(tree);

      // instance identifier
      tree.id = panzer.id + '_' + panzer.cnt + '_' + klassInstCnt;
      // collection of tree instances waiting for the end of our navigation
      tree.qe = [];
      // collection of tree instances we're waiting to complete their navigation
      tree.q = [];
      // collection of instructions
      tree.ics = [];
      // event trail
      tree.trail = [];
      // alias panzer
      tree.pzr = panzer;
      // alias public proxy instance
      tree.pxy = proxy;
      // cache number of packages at time of instantiation
      tree.pkgsLn = panzer.pkgs.length;

      // init package loop locks
      tree.locks = new Array(tree.pkgsLn);

      // fake last move as traversing on the null node
      tree.lastMove = moveTraverseOn;

      // package config - it will be removed after initialization
      tree.j = config;

      // privileged (package) api for controlling this tank
      tree.tank = {
        id: tree.id,
        // the number of calls to go
        // mirrors `tree.cc`
        cc: 0,
        index: 0,
        target: -1,
        path: '..//',
        depth: 0,

        // direct tank to a node
        go: tankGo.bind(tree),
        active: false,

        // stop the tank
        stop: tankStop.bind(tree),
        stopped: false,

        // block a tree node
        block: tankBlock.bind(tree),
        blocked: false,

        // queue commands behind other trees
        queue: tankQueue.bind(tree),
        queued: false,

        // override default tank.toString
        toString: proxyToString

      };

      // add tree-bound toString method to the proxy
      proxy.toString = proxyToString;

      // compose tree package instances
      // using packages present at initialization
      tree.pkgs = panzer.pkgs.map(function (panzerPkg, pkgIdx) {
        var
          pkgName = panzerPkg.name,
          pkgInst = new panzerPkg.def()
        ;

        // add to collection of package instances
        pkgInstKeys[pkgName] = pkgInst;

        // compose package-instance
        pkgInst.pkgs = pkgInstKeys;
        pkgInst.tank = tree.tank;
        pkgInst.proxy = proxy;

        // provide access to tree from this package
        pkgInst.toString = proxyToString;

        // instantiated package confguration
        return {
          name: pkgName,
          idx: pkgIdx,
          pkg: panzerPkg,
          inst: pkgInst,
          lock: 0
        };
      });

      // attempt to extract an existing tree instance from the source object
      origTree = getTree(source);
      // if the source references an existing tree instance...
      if (origTree) {
        // use the original tree's source value
        tree.raw = origTree.raw;
      } else {
        // capture the source as the raw property
        tree.raw = source;
      }

      // when...
      if (
        // we have a tree instance
        origTree &&
        // the number of packages hasn't changed
        panzer.pkgs.length == origTree.pkgsLn &&
        // all packages allow cloning
        allPkgsAllowCloning(panzer)
      ) {
        // clone existing nodes and skip compilation
        finishTreeInit(tree, cloneNodes(origTree.nodes), done);
      } else {
        // re-compile source
        compileNodes(tree, tree.raw, done);
      }

    }

    Tree.prototype = {

      // count of events fired on this instance
      en: 0,

      // flag for when navigation should stop
      stop: 0,

      // trip count
      tc: 0,

      // loop count
      lc: 0,

      // command count
      cc: 0,

      // readiness flag
      // ret: 0,
      // next move flag
      nextMove: 0,

      // resume flag
      resuming: 0,

      // number of tree instances watching our navigation
      qeLn: 0,

      // number of tree instances we're waiting to complete their navigation
      qLn: 0,

      // name of final method to invoke in `tankGo()`
      //  "later" is until the tree initializes
      //  "now" is used once tree has initialized
      ret: 'later',

      // called at end of `tankGo()` when tree isn't ready
      later: function () {
        var tree = this;

        // navigate once initialized
        tree.pxy.ready.then(function () {
          tree.go();
        });
      },

      // called at end of `tankGo()` once tree is ready
      now: function () {
        var tree = this;

        // if in loop...
        if (tree.loop) {
          // attempt to unlock tree from the current/last package
          tree.unlock();
        }
        // navigate now
        tree.go();
      },

      tally: function (eventIndex) {
        var
          tree = this,
          tallies = tree.et,
          nodeIndex = tree.current.index
        ;

        return {
          // total occurences for proxy
          proxy: tickEventTally(tallies[0], eventIndex),
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
          pkgLocks[pkgIdx] = 1;
          // increment stop flag
          tree.stop += pkgIdx + 1;
          // flag success locking
          // and update tank
          return tree.tank.stopped = true;
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

      // navigate towards a target node
      go: function () {
        var
          tree = this,
          nodes = tree.nodes,
          tank = tree.tank,
          firstRun = 1,
          nextIndex,
          clearStack,
          gateBeginEnd,
          gateMoveIdle,
          gateEngageRelease
        ;

        function completeMove() {
          // make the next move the last move
          tree.lastMove = tree.nextMove;
          // clear the next move
          tree.nextMove =
          // flag that we're no longer resuming
          tree.resuming =
            0;
        }

        // update public state
        tank.stopped = false;

        // if we were waiting for other trees to navigate...
        if (tree.q.length) {
          // unqueue from instances we were waiting on
          tree.q.forEach(function  (inst) {
            var queuees = inst.qe;

            // remove self as a waiting instance
            delete queuees[tree.id];
            queuees.splice(queuees.indexOf(tree), 1);
          });

          // create new queue
          tree.q = [];
        }
        // update tank
        tank.queued = false;

        // if already looping...
        if (tree.loop) {
          // exit early
          return;
        }

        // if this tree has a stack and the event stack is empty...
        if (tree.stack && !eventStack.length) {
          // set event stack to the tree's stack
          eventStack = tree.stack;
          // flag that the stack needs to be removed later
          clearStack = 1;
        }

        // reset loop flag
        tree.loop =
        // set tank to match
        tank.active =
          true;
        // reset stop flag
        tree.stop = 0;
        // reset package locks
        tree.locks = new Array(tree.pkgsLn);
        // reset blocked flag
        tank.blocked = !!isBlocked(tree);

        // if resuming the last nextMove...
        if (tree.resuming) {
          // complete incomplete move, when...
          if (
            // the target changed
            tree.lastTarget !== tree.target &&
            // the next move changed
            getNextMove(tree) !== tree.nextMove
          ) {
            // behave as if last move completed
            tree.lastMove = tree.nextMove;
            // clear this next move
            tree.nextMove = 0;
          }
        } else { // otherwise, when new trip...
          // init event tallies
          tree.et[2] = createEventTally();      // trip
          tree.et[3] = new Array(nodes.length); // path

          // tick trip count
          tree.tc++;
          // reset leg count
          tree.lc = 0;

          // begin new event trail
          tree.trail = [];
        }

        // create new event tally for this leg of the trip
        tree.et[4] = createEventTally();
        // increment leg count
        tree.lc++;

        // during loop...
        while (tree.loop) {

          // calculate next move, when...
          if (
            // we have a target, and...
            tree.target &&
            // we're not stopped, and...
            !tree.stop && (
              // there's no next move, or...
              !tree.nextMove ||
              // this is a new target
              tree.lastTarget !== tree.target
            )
          ) {
            // capture new target as the last target
            tree.lastTarget = tree.target;
            // capture next move
            tree.nextMove = getNextMove(tree);
          }

          // if we haven't fired "begin" yet and we haven't stopped...
          if (!gateBeginEnd && !tree.stop && (tree.target || firstRun)) {
            // flag that this is no longer the first run
            firstRun = 0;
            // if "begin" event succeeds...
            if (tree.fire(BEGIN) !== INTERCEPT) {
              // open gate
              gateBeginEnd = 1;
            }
            continue;
          }

          // if there is a target and we haven't stopped...
          if (tree.target && !tree.stop) {

            // if we haven't fired "move" yet...
            if (!gateMoveIdle) {
              // if "move" event succeeds
              if (tree.fire(MOVE) !== INTERCEPT) {
                // open gate
                gateMoveIdle = 1;
              }
              continue;
            }

            // if next move is a node switch...
            if (tree.nextMove < moveTraverseOn) {

              // if engaged to the current node...
              if (gateEngageRelease) {
                // release the node
                gateEngageRelease = 0;
                // fire release event
                tree.fire(RELEASE);
                continue;
              }

              // if succesfully switched nodes and not stopped...
              if (
                tree.fire(
                  SWITCH,
                  [tree.current.index, (nextIndex = getSwitchIndex(tree.current, tree.nextMove))]
                ) !== INTERCEPT &&
                !tree.stop
              ) {
                // perform switch

                // change the current node
                tree.current = nodes[nextIndex];

                // update tank properties
                tank.index = tree.current.index;
                tank.path = tree.current.path;
                tank.depth = tree.current.depth;
                tank.blocked = !!isBlocked(tree);

                completeMove();
              }
              continue;

            } else {

              // (otherwise) when traversing or scoping...

              // if not engaged to the current node...
              if (!gateEngageRelease) {
                // if "engage" event succeeds
                if (tree.fire(ENGAGE) !== INTERCEPT) {
                  // open gate
                  gateEngageRelease = 1;
                }
                continue;
              }

              // if next move is scope...
              if (tree.nextMove > moveTraverseBover) {
                // if successfully scoped and not stopped afterward...
                if (
                  tree.fire(SCOPE, [tree.nextMove - 10]) !== INTERCEPT &&
                  !tree.stop
                ) {
                  completeMove();
                }
                continue;
              }

              // (otherwise) next move is traversal..

              // if successfully traversed and not stopped...
              if (
                tree.fire(TRAVERSE, [tree.nextMove - 5]) !== INTERCEPT &&
                !tree.stop
              ) {

                // when...
                if (
                  // this is the last traversal
                  tree.nextMove === moveTraverseOn &&
                  // the target hasn't changed
                  tree.lastTarget === tree.target
                ) {
                  // remove target
                  tree.target = 0;
                  // remove tank target
                  tank.target = -1;
                }

                completeMove();
              }
              continue;

            }

          }

          // (otherwise) when no target or we've stopped...

          // if engaging the current node...
          if (gateEngageRelease) {
            // close gate
            gateEngageRelease = 0;
            // fire release event
            tree.fire(RELEASE);
            continue;
          }

          // if we fired "move"...
          if (gateMoveIdle) {
            // close gate
            gateMoveIdle = 0;
            // fire "idle" event
            // report how many nodes away we are?
            tree.fire(IDLE);
            continue;
          }

          // if we fired "begin"...
          if (gateBeginEnd) {
            // close gate
            gateBeginEnd = 0;
            // fire "END" event
            tree.fire(END);
            continue;
          } else {
            // (otherwise) exit loop
            tree.loop = 0;
          }

        }

        tank.active = false;

        // capture next move on exit - if any
        // tree.nextMove = nextMove;
        // capture last move on exit
        // tree.lastMove = lastMove;
        // capture last target - if any
        // tree.lastTarget = lastTarget;

        // if we still have a target...
        if (tree.target) {
          // note that we're resuming the next call
          tree.resuming = 1;
          // clone interupted stack
          tree.stack = eventStack.concat();
        } else {

          // (otherwise) we're done navigating...

          // clear events stack
          tree.stack = 0;

          // report arrival to awaiting directions
          // this resolves promises and is async
          reportCompletion(tree);
        }

        // if instructed to clear the stack...
        if (clearStack) {
          // clear when the stack came from this tree stack
          eventStack = [];
        }

        // if no targets and there are tree's waiting on us...
        if (!tree.target && tree.qe.length) {
          tree.qe.forEach(function (inst) {
            delete inst.q[tree.id];
            inst.q.splice(inst.q.indexOf(tree), 1);
            // if this instance has no more dependents...
            if (!inst.q.length) {
              // navigate towards it's current target
              inst.go();
            }
          });
        }
      },

      // invoke package event handlers
      // returns INTERCEPT if the given event was not fired
      fire: function (eventIndex, params) {
        var
          tree = this,
          blocks = tree.b,
          curNode = tree.current,
          curIdx = curNode.index,
          wasNotStopped = !tree.stop,
          nextMove = tree.nextMove,
          rslt
        ;

        // ensure params is an array
        if (!params) {
          params = [];
        }

        // intercept trigger, when...
        if (
          // this event is interceptable, and...
          (eventIndex < RELEASE || eventIndex > END) &&
          // the path is not clear
          isBlocked(tree)
        ) {
          // intercept the block
          rslt = fireTreeEvent(
            tree,
            INTERCEPT,
            // params
            [
              // the intercepted path
              curNode.path,
              // the intercepted event type and params
              {
                type: eventNameMap[eventIndex],
                params: params
              }//,
              // the promise(s) blocking up navigation
              // hold[0].concat()
            ],
            tree.tally(INTERCEPT)
          );

          // release block, when...
          if (
            // the result is an array
            isArray(rslt) &&
            // at least one is `true`
            rslt.some(resultIsTrue) &&
            // no result is `false`
            rslt.every(resultIsNotfalse)
          ) {
            // clear all blocks on this node
            blocks[curIdx] = 0;
            // if unblocking a switch move...
            if (nextMove < moveTraverseOn) {
              // unblock the switch-to node as well
              blocks[getSwitchIndex(curNode, nextMove)] = 0;
            }
          } else {
            // honor block by stopping navigation
            // increments one value beyond what the packages can decrement
            ++tree.stop;
            // return the fired event
            return INTERCEPT;
          }
        }

        // if resuming a motion event...
        if (tree.resuming && eventIndex > END) {
          // if the stopped event wasn't a gate event...
          if (!tree.nixgate) {
            // bump to corresponding  "xyz-resume" event's index
            eventIndex++;
          }
          // clear nixgate flag
          tree.nixgate = 0;
        }

        // fire the target event
        fireTreeEvent(
          tree,
          eventIndex,
          params,
          tree.tally(eventIndex)
        );

        // if stopped...
        if (tree.stop) {
          // if not stopped before...
          if (wasNotStopped) {
            // capture when a gate event is stopped
            tree.nixgate = eventIndex < SWITCH;
          }
        }
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
                // index of this package definition
                pkgEntryIdx,
                pkgInst
              ;
              // if this package's index is 1 or more and we have a valid method name...
              if (
                isFullString(methodName) &&
                (pkgEntryIdx = panzer.defs.indexOf(this)) > 0
              ) {
                // create younger proxy instance
                pkgInst = new panzer.pkgs[pkgEntryIdx - 1].proxy();
                // if the method exists at this link in the prototype chain...
                if (isFunction(pkgInst[methodName])) {
                  // return the matching method
                  return pkgInst[methodName];
                }
              }

              // (otherwise) return an empty function
              return function () {};
            }
          }
        ;

        // shared and bound by Tree instances
        function proxyToString() {
          // if called by `#getTree()`...
          if (arguments.callee.caller === getTree) {
            // return instance
            return this;
          }

          // (otherwise) emulate normal `#toString()` behavior
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
        // capture original prototype - for testing uplinks in chain
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
  Array, Object, RegExp, Error, Promise, this
);
