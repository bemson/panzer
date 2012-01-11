module('Panzer');

test('Dependencies', 4, function () {
  ok(Array.prototype.some, 'The Array.prototype.some method exists.');
  ok(Array.prototype.forEach, 'The Array.prototype.forEach method exists.');
  ok(Array.prototype.map, 'The Array.prototype.map method exists.');
  equal(typeof genData, 'function', 'The genData function is present.');
});

test('Namespace', 4, function () {
  equal(typeof Panzer, 'object', 'The Panzer namespace is present.');
  equal(typeof Panzer.version, 'string', 'The Panzer.version string is present.');
  ok(!isNaN(parseInt(Panzer.version)), 'The Panzer.version string can be parsed into a number.');
  equal(typeof Panzer.create, 'function', 'The Panzer.create() method is present.');
});

test('Class', function () {
  var
    Klass = Panzer.create();
  equal(typeof Klass, 'function', 'Panzer.create() returns a (Panzer) class definition function.');
  raises(Klass, 'The class must be called with the "new" operator.');
  equal(typeof Klass.pkg, 'function', 'The class has a static .pkg() method.');
});

test('Instance', function () {
  var
    Klass = Panzer.create(),
    inst = new Klass(),
    mbr, mbrs = 0;
  ok(inst instanceof Klass, 'Objects instantiated by a Panzer class are instances of that class.');
  ok(inst.hasOwnProperty('toString'), '"toString" is a non-inherited member.');
  equal(typeof inst.toString, 'function', '.toString() is a method.');
  ok(
    [0, 1, {}, function () {}, '1']
      .every(function (arg) {
        return inst.toString(arg) === ({}).toString();
      }),
    'The .toString() method returns the same result as "({}).toString()", despite any argument.'
  );
  ok(inst.hasOwnProperty('pkgs'), '"pkgs" is a non-inherited member.');
  equal(typeof inst.pkgs, 'object', '.pkgs is an object.');
  mbrs = 0;
  for (mbr in inst.pkgs) {
    if (inst.pkgs.hasOwnProperty(mbr)) {
      mbrs++;
      break;
    }
  }
  equal(mbrs, 0, 'By default, the .pkgs property has no (non-inherited) members.');
});

test('Package', function () {
  var
    Klass = Panzer.create(),
    pkgList = Klass.pkg(),
    pkgName1 = 'a',
    pkgName2 = 'b',
    inst,
    KlassPrototype = Klass.prototype;
  equal(pkgList.constructor, Array, 'The .pkg() method returns an array, when called with no arguments.');
  equal(pkgList.length, 0, 'By default, a class has no installed packages.');
  ok(
    [0, 1, {}, function () {}, '$']
      .every(function (arg) {
        return Klass.pkg(arg) === false;
      }),
    'The .pkg() method returns false when called with a non-alphanumeric string.'
  );
  equal(typeof Klass.pkg(pkgName1), 'function', 'The .pkg() method returns a package-definition function when passed an alphanumeric string.');
  strictEqual(Klass.pkg(pkgName2), Klass.pkg(pkgName2), 'The .pkg() method returns the same package-definition, per unique package name.');
  Klass.pkg(pkgName2);
  deepEqual(Klass.pkg(), [pkgName1, pkgName2], 'The array, returned by calling .pkg() with no arguments, lists the packages for a Panzer class, in the order that they were created.');
/*  inst = new Klass();
  ok(
    Klass.pkg()
      .every(function (pkgName) {
        return Klass.pkg(pkgName).prototype.isPrototypeOf(inst);
      }),
    'The Panzer instance shares the prototype of all previously defined packages.'
  );
  equal(Klass.prototype, Klass.pkg(Klass.pkg().slice(-1)[0]).prototype, 'The Panzer class prototype points to the prototype of the last defined package.');
*/});

module('Package');

test('Definition/Class', function () {
  var
    Klass = Panzer.create(),
    instBeforePkg = new Klass(),
    pkgDef = Klass.pkg('a'),
    instAfterPkg = new Klass();
  equal(typeof pkgDef(instAfterPkg), 'object', 'Returns the package instance, when given a Panzer instance.');
  ok(pkgDef(instAfterPkg) instanceof pkgDef, 'The package-definition is the constructor class of a package instance.');
  equal(pkgDef(instBeforePkg), false, 'Returns false when given a Panzer instance that was defined before the package.');
  equal(pkgDef(new (Panzer.create())), false, 'Returns false when given a Panzer instance from different Panzer class.');
  ok(
    [0, 1, [], {}, function () {}]
      .every(function (arg) {
        return pkgDef(arg) === false
      }),
    'Returns false when passed any other JavaScript value.'
  );
});

test('Instances', function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    pkgDef2 = Klass.pkg('b'),
    proxy = new Klass(),
    pkgInst = pkgDef(proxy);
  ok(pkgInst.hasOwnProperty('nodes'), 'There is a non-inherited .nodes member.');
  ok(pkgInst.nodes instanceof Array, 'The .nodes member is an array.');
  ok(pkgInst.nodes !== pkgDef2(proxy).nodes, 'Each package-instance has their own .nodes collection.');
  equal(pkgInst.nodes.length, 2, 'Two nodes are added to those parsed from the tree parameter.');
  ok(pkgInst.hasOwnProperty('proxy'), 'There is a non-inherited .proxy member.');
  equal(typeof pkgInst.proxy, 'object', 'The .proxy member is an object.');
  ok(pkgInst.proxy === pkgDef2(proxy).proxy, 'The .proxy object is shared between package-instances.');
  ok(pkgInst.hasOwnProperty('tank'), 'There is a non-inherited .tank member.');
  equal(typeof pkgInst.tank, 'object', 'The .tank member is an object.');
  ok(pkgInst.tank === pkgDef2(proxy).tank, 'Package-instances share a single .tank object.');
});

test('Nodes', function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    pkgDef2 = Klass.pkg('b'),
    proxy = new Klass(['any','js','object']),
    pkgInst = pkgDef(proxy),
    node = pkgInst.nodes[0];
  equal(pkgDef(new Klass()).nodes.length, 2, 'Even when a Panzer instance tree is not an object, two nodes exist.');
  'name|value|index|depth|attributes|path|children|parentIndex|previousIndex|nextIndex|firstChildIndex|lastChildIndex'.split('|')
    .forEach(function (mbr) {
      ok(node.hasOwnProperty(mbr), 'Has a "' + mbr + '" member.');
    });
  '_tree|_root'.split('|')
    .forEach(function (name, idx) {
      equal(pkgInst.nodes[idx].name, name, 'By default, the name member of the node at index ' + idx + ' is "' + name + '".');
    });
  strictEqual(node.previousIndex, undefined, 'Unset .xxxIndex member properties are undefined.');
  ok(pkgInst.nodes[1].attributes === pkgDef2(proxy).nodes[1].attributes, 'Nodes at the same index, from different package-instances, reference the same .attributes object.');
});

module('Tank API');

test('.go()', function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    pkgInst = pkgDef(new Klass({a:1, b:2})),
    tank = pkgInst.tank;
  equal(typeof tank.go, 'function', 'Has the .go() method.');
  equal(tank.go(tank.currentIndex), 1, 'Returns 1 when targeting the current index.');
  ok(tank.go(1) > 0, 'Returns a positive integer when given a valid node index.');
  equal(tank.go(), 0, 'Returns zero when called with no arguments.');
  ok(
    ['', undefined, null, {}, function () {}, -1, pkgInst.nodes.length]
      .every(function (arg) {
        return tank.go(arg) === 0;
      }),
    'Returns 0 when passed a target index outside the range of available nodes.'
  );
});

test('.stop()', function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    pkgInst = pkgDef(new Klass()),
    tank = pkgInst.tank;
  equal(typeof tank.stop, 'function', 'Has the .stop() method.');
  equal(typeof tank.stop(), 'boolean', 'Returns a boolean.');
});

test('.post()', function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    pkgInst = pkgDef(new Klass()),
    tank = pkgInst.tank,
    fnc = function () {},
    fncIdx;
  equal(typeof tank.post, 'function', 'Has the .post() method.');
  fncIdx = tank.post(fnc);
  equal(typeof fncIdx, 'number', 'Returns a post-function index when given a function.');
  ok(
    !tank.post() &&
    [-1, fncIdx + 1, [], {}, '']
      .every(function (arg) {
        return tank.post(arg) === false;
      }),
    'Returns false when passed nothing or anything but a valid post-function index or function.'
  );
  strictEqual(tank.post(fncIdx), true, 'Returns true when given a valid post-function index.');
  strictEqual(tank.post(fncIdx), false, 'Returns false when given an previously removed post-function index.');
});

test('.id', function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    pkgDef2 = Klass.pkg('b'),
    pkgInst = pkgDef(new Klass()),
    tank = pkgInst.tank;
  equal(typeof tank.id, 'number', 'Has the .id member which is a number.');
  equal(tank.id, 0, 'The .id value for the first Panzer instance is 0.');
  ok(
    [1,2,3].every(function (id) {
      return pkgDef(new Klass()).tank.id === id;
    }),
    'The .id member increments by one, after each Package instance.'
  );
});

test('.currentIndex', function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    pkgInst = pkgDef(new Klass(['any','js','object'])),
    tank = pkgInst.tank;
  equal(typeof tank.currentIndex, 'number', 'Has a .currentIndex member which is a number.');
  equal(tank.currentIndex, 0, 'The value is 0, by default.');
  ok(
    (new Array(pkgInst.nodes.length))
      .every(function (nil, idx) {
        tank.go(idx);
        return tank.currentIndex === idx;
      }),
    'Reflects the index of the pointer-node.'
  );
});

test('.targetIndex', function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    pkgInst = pkgDef(new Klass()),
    tank = pkgInst.tank;
  equal(typeof tank.targetIndex, 'number', 'Has a .targetIndex member which is a number.');
  equal(tank.targetIndex, -1, 'The value is -1, by default.');
});

module('Package-Definition');

test('.node', function () {
  var
    Klass = Panzer.create(),
    nodeMthdName = 'foo',
    pkgDef = Klass.pkg('a'),
    pkgInst = pkgDef(new Klass()),
    nodeInst = pkgInst.nodes[0];
  ok(pkgDef.node.isPrototypeOf(nodeInst), 'Node instances of a Panzer instance are prototyped by the .node member.');
  pkgDef.node[nodeMthdName] = function () {
    ok(this === nodeInst, 'The scope of .node method is the node instance.');
  };
  equal(typeof nodeInst[nodeMthdName], 'function', 'Members added to the .node member are available in a node instance.');
  nodeInst[nodeMthdName]();
});

test('.proxy', function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    pkgMthdName = 'foo',
    inst = new Klass();
  ok(pkgDef.proxy.isPrototypeOf(inst), 'A Panzer instance prototype includes the .proxy member.');
  pkgDef.proxy[pkgMthdName] = function () {
    ok(this === inst, 'The scope of .proxy methods is the Panzer instance.');
    ok(this.hasOwnProperty('pkgs'), 'The .pkgs member is available to methods from the .proxy member.');
    ok(this.hasOwnProperty('toString'), 'The .toString member is available to methods from the .proxy member.');
  };
  inst[pkgMthdName]();
  ok(Klass.pkg('b').proxy[pkgMthdName], 'Each package extends upon the .proxy prototype chain of the last package.');
});

test('.init', function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    expandoProp = 'abc',
    expandoVal = {},
    nodeMbrName = 'foo',
    pkgInst, initScope;
  equal(pkgDef.init, 0, 'Default value is 0.');
  pkgDef.init = function () {
    initScope = this;
    ok(1, 'When present, the .init function is invoked when a Panzer class is instantiated.');
  };
  pkgInst = pkgDef(new Klass());
  ok(initScope === pkgInst, 'The scope of the .init function is the package-instance.');
  pkgDef.init = function () {
    ok(this.hasOwnProperty('nodes'), 'The .nodes collection is available from the .init function.');
    ok(!this.hasOwnProperty('proxy'), 'The .proxy member is not available from the .init function.');
    ok(!this.hasOwnProperty('tank'), 'The .tank member is not available from the .init function.');
  };
  pkgInst = pkgDef(new Klass());
  ok(
    'tank|proxy'.split('|')
      .every(function (prop) {
        return pkgInst.hasOwnProperty(prop);
      }),
    'The .proxy and .tank members are added to a package-instance, after the .init function executes.'
  );
  pkgDef.init = function () {
    this[expandoProp] = expandoVal;
  };
  pkgInst = pkgDef(new Klass());
  equal(pkgInst[expandoProp], expandoVal, 'Members added to the scope of an .init function are present in the package-instance.');
  ok(!Klass.pkg('b')(new Klass()).hasOwnProperty('expandoProp'), 'Members added via the .init function, are not added to the instances of other packages.');
  pkgDef.node[nodeMbrName] = expandoVal;
  pkgDef.init = function () {
    strictEqual(this.nodes[0][nodeMbrName], expandoVal, 'Members of the .node object are available to node instances within the .init function.');
  }
  new Klass();
});

test('.attributeKey', function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    treeParam = {
      foo: 1,
      bar: 2,
      _foo: 3,
      _bar: 4
    },
    allAsNodes = 6,
    randValue = Math.random(),
    pkgInst, val, scope, args;
  strictEqual(pkgDef.attributeKey, 0, 'The default value is 0.');
  equal(pkgDef(new Klass(treeParam)).nodes.length, allAsNodes, 'By default, all keys become nodes.');
  ok(
    [null, undefined, 1, '', {}, []].every(function (value) {
      pkgDef.attributeKey = value;
      return pkgDef(new Klass(treeParam)).nodes.length === allAsNodes;
    }),
    'All keys become nodes when set to anything besides a function or regular expression.'
  );
  pkgDef.attributeKey = /\d/;
  equal(pkgDef(new Klass(treeParam)).nodes.length, allAsNodes, 'A non-matching regular expression allows all keys to become nodes.');
  pkgDef.attributeKey = /^_/;
  pkgInst = pkgDef(new Klass(treeParam));
  equal(pkgInst.nodes.length, allAsNodes - 2, 'A matching regular expression reduces the number of keys that become nodes.');
  ok(
    pkgInst.nodes[1].attributes.hasOwnProperty('_foo') && pkgInst.nodes[1].attributes.hasOwnProperty('_bar'),
    'Keys that match a regular expression, become attributes of their parent node.'
  );
  pkgDef.attributeKey = function (name, value) {
    scope = this;
    args = arguments;
  };
  pkgInst = pkgDef(new Klass({oneKey: randValue}));
  ok(scope === window, 'Functions execute in the global scope.');
  equal(args.length, 2, 'Functions receives two arguments.');
  equal(typeof args[0], 'string', 'The first argument given to functions is the key name, a string.');
  equal(pkgInst.nodes.length, 3, 'All keys become nodes when a function returns nothing or a falsy value.');
  val = 0;
  pkgDef.attributeKey = function () {
    val = 1;
  };
  new Klass();
  new Klass({});
  new Klass('');
  new Klass(1);
  equal(val, 0, 'Functions are not fired when there are no keys to parse.');
  pkgDef.attributeKey = function (name, value) {
    return value < 3;
  };
  pkgInst = pkgDef(new Klass(treeParam));
  equal(pkgInst.nodes.length, allAsNodes - 2, 'When a function returns true, fewer keys are parsed into nodes.');
  ok(
    pkgInst.nodes[1].attributes.hasOwnProperty('foo') && pkgInst.nodes[1].attributes.hasOwnProperty('bar'),
    'When a function returns true, a key becomes an attribute of the node parsed from the lexical context.'
  );
  pkgDef.attributeKey = function () {
    pkgDef.attributeKey = 0;
    return true;
  };
  pkgInst = pkgDef(new Klass(treeParam));
  equal(pkgInst.nodes.length, 2, 'The .attributeKey function is cached during compilation.');
});

test('.invalidKey', function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    treeParam = {
      foo: 1,
      bar: 2,
      _foo: 3,
      _bar: 4
    },
    allAsNodes = 6,
    randValue = Math.random(),
    pkgInst, val, scope, args;
  strictEqual(pkgDef.invalidKey, 0, 'The default value is 0.');
  equal(pkgDef(new Klass(treeParam)).nodes.length, allAsNodes, 'By default, all keys become nodes.');
  ok(
    [null, undefined, 1, '', {}, []].every(function (value) {
      pkgDef.invalidKey = value;
      return pkgDef(new Klass(treeParam)).nodes.length === allAsNodes;
    }),
    'All keys become nodes when set to anything besides a function or regular expression.'
  );
  pkgDef.invalidKey = /\d/;
  equal(pkgDef(new Klass(treeParam)).nodes.length, allAsNodes, 'A non-matching regular expression allows all keys to become nodes.');
  pkgDef.invalidKey = /^_/;
  pkgInst = pkgDef(new Klass(treeParam));
  equal(pkgInst.nodes.length, allAsNodes - 2, 'A matching regular expression reduces the number of keys that become nodes.');
  pkgDef.invalidKey = function (name, value) {
    scope = this;
    args = arguments;
  };
  pkgInst = pkgDef(new Klass({oneKey: randValue}));
  ok(scope === window, 'Functions execute in the global scope.');
  equal(args.length, 2, 'Functions receives two arguments.');
  equal(typeof args[0], 'string', 'The first argument given to functions is the key name, a string.');
  equal(pkgInst.nodes.length, 3, 'All keys become nodes when a function returns nothing or a falsy value.');
  val = 0;
  pkgDef.invalidKey = function () {
    val = 1;
  };
  new Klass();
  new Klass({});
  new Klass('');
  new Klass(1);
  equal(val, 0, 'Functions are not fired when there are no keys to parse.');
  pkgDef.invalidKey = function (name, value) {
    return value < 3;
  };
  pkgInst = pkgDef(new Klass(treeParam));
  equal(pkgInst.nodes.length, allAsNodes - 2, 'When a function returns true, fewer keys are parsed into nodes.');
  pkgDef.invalidKey = function () {
    pkgDef.invalidKey = 0;
    return true;
  };
  pkgInst = pkgDef(new Klass(treeParam));
  equal(pkgInst.nodes.length, 2, 'The .invalidKey function is cached during compilation.');
});

test('.onBegin', function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    pkgInst = pkgDef(new Klass(['any','js','object'])),
    tank = pkgInst.tank,
    val = 0;
  equal(pkgDef.onBegin, 0, 'The default value is 0.');
  pkgDef.onBegin = function () {
    val++;
  };
  tank.go(pkgInst.nodes.length - 1);
  equal(val, 1, 'As a function, .onBegin is called when a tank begins navigating a tree.');
  pkgDef.onBegin = function () {
    ok(this === pkgInst, 'The execution scope is the package-instance.');
    equal(arguments.length, 1, 'One argument is passed.');
    equal(arguments[0], 'begin', 'The argument is the "begin" string, the event name.');
    return false;
  };
  tank.go(0);
});

test('.onTraverse', function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    pkgInst = pkgDef(new Klass([['child','nodes'],'sibling','nodes'])),
    tank = pkgInst.tank,
    evtTypes = [2, 4, 1, 3, 1, 0],
    val = 0,
    scope, args;
  equal(pkgDef.onTraverse, 0, 'The default value is 0.');
  pkgDef.onTraverse = function () {
    val++;
  };
  tank.go(1);
  equal(val, 2, 'As a function, .onTraverse is called when a tank traverses the node of the tree.');
  pkgDef.onTraverse = function () {
    scope = this;
    args = arguments;
    return false;
  };
  tank.go(pkgInst.nodes.length - 1);
  ok(scope === pkgInst, 'The execution scope is the package-instance.');
  equal(args.length, 2, 'Two arguments are passed.');
  equal(args[0], 'traverse', 'The first argument is the "traverse" string, the event name.');
  equal(typeof args[1], 'number', 'The second argument is the traversal type, a number.');
  val = 1;
  pkgDef.onTraverse = function (evtName, evtType) {
    val &= evtType === evtTypes.shift();
  };
  tank.go(4);
  equal(val, 1, 'During navigation, the traversal types 0, 1, 2, 3, and 4 occur in the expected order.');
});

test('.onEnd', function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    pkgInst = pkgDef(new Klass(['any','js','object'])),
    tank = pkgInst.tank,
    val = 0;
  equal(pkgDef.onEnd, 0, 'The default value is 0.');
  pkgDef.onEnd = function () {
    val++;
  };
  tank.go(pkgInst.nodes.length - 1);
  equal(val, 1, 'As a function, .onEnd is called when a tank ends navigating a tree.');
  pkgDef.onEnd = function () {
    ok(this === pkgInst, 'The execution scope is the package-instance.');
    equal(arguments.length, 1, 'One argument is passed.');
    equal(arguments[0], 'end', 'The argument is the "end" string, the event name.');
    return false;
  };
  tank.go(0);
});

module('Navigation');

test('Event Callbacks', function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    vals = [],
    pkgInst = pkgDef(new Klass()),
    tank = pkgInst.tank;
  pkgDef.onBegin = pkgDef.onTraverse = pkgDef.onEnd = function (evt) {
    vals.push(evt);
  };
  tank.go(0);
  deepEqual(vals, 'begin|traverse|end'.split('|'), 'Traversal events occur in the expected sequence.');
  vals = [];
  pkgDef.onTraverse = 0;
  pkgDef.onBegin = function () {
    this.tank.stop();
  };
  equal(tank.go(0), 0, 'No nodes are traversed when navigation is stopped from the "begin" callback.');
  equal(vals.length, 1, 'The "end" event fires regardless of whether navigation is stopped.');
  strictEqual(tank.stop(), false, 'tank.stop() returns false when the Panzer instance is idle.');
  pkgDef.onBegin = function () {
    strictEqual(this.tank.stop(), true, 'tank.stop() returns true from an event callback.');
  };
  tank.go(0);
});

test('Traversal', function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    pkgInst = pkgDef(new Klass([['child','nodes'],'sibling','nodes'])),
    tank = pkgInst.tank,
    evtsTally = [],
    evtMap;
  pkgDef.onBegin = function () {
    evtMap = [];
    evtsTally.push(evtMap);
  };
  pkgDef.onTraverse = function (name, type) {
    evtMap.push(type + "");
  };
  tank.go(0);
  tank.go(pkgInst.nodes.length - 1);
  tank.go(4);
  tank.go(1);
  deepEqual(
    evtsTally,
    [
      '0'.split(''),
      '13310'.split(''),
      '241310'.split(''),
      '2420'.split('')
    ],
    'The tank traverses a tree as expected.'
  );
});

test('Routing', function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    pkgInst = pkgDef(new Klass(['any','js','object'])),
    tgtIndex = pkgInst.nodes.length - 1,
    tank = pkgInst.tank,
    initialIndex = tank.currentIndex,
    finalIndex = 1,
    val = 0;
  pkgDef.onBegin = function () {
    this.tank.stop();
  };
  tank.go(tgtIndex);
  equal(tank.currentIndex, initialIndex, 'Navigation was aborted from an event callback.');
  pkgDef.onBegin = function () {
    this.tank.go(finalIndex);
  };
  tank.go(tgtIndex);
  ok(tank.currentIndex !== tgtIndex && tank.currentIndex === finalIndex, 'The originally targeted node was not reached due to routing navigation from an event callback.');
  pkgDef.onBegin = 0;
  pkgDef.onTraverse = function (name, type) {
    switch (type) {
      case 2 : // out
        tank.go(1);
        val++;
        break;
      case 3 : // over
        tank.go(1);
        val++;
        break;
      case 4: // bover
        tank.go(3);
        val++;
    }
  };
  tank.go(3);
  equal(val, 1, 'Redirecting in the opposite direction, during an "over" event, does not trigger a "bover" event.');
  tank.go(2);
  tank.go(3);
  equal(val, 2, 'Redirecting in the opposite direction, during a "bover" event, does not trigger an "over" event.');
});

test('Postbacks', function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    pkgInst = pkgDef(new Klass(['any','js','object'])),
    tank = pkgInst.tank,
    val = 0,
    lastIndex = pkgInst.nodes.length - 1,
    tgtIndex = 1,
    postId, normalTraversalCount;
  function inc() {
    val++;
  }
  tank.post(inc);
  tank.go(tgtIndex);
  equal(val, 0, 'Postbacks set outside a callback (an idle Panzer instance) are ignored.');
  pkgDef.onBegin = function () {
    tank.post(inc);
  };
  tank.go(tgtIndex);
  equal(val, 1, 'Postbacks set from a callback are executed.');
  val = 0;
  pkgDef.onBegin = function () {
    postId = tank.post(inc);
  };
  pkgDef.onEnd = function () {
    tank.post(postId);
  };
  tank.go(tgtIndex);
  equal(val, 0, 'Postbacks set in one event callback can be removed by another event callback.');
  pkgDef.onBegin = 0;
  pkgDef.onEnd = function () {
    if (!val++) {
      tank.go(tgtIndex);
    }
  };
  normalTraversalCount = tank.go(lastIndex);
  val = 0;
  pkgDef.onEnd = function () {
    if (!val++) {
      this.tank.post(
        function () {
          tank.go(tgtIndex);
        }
      );
    }
  };
  ok(normalTraversalCount > tank.go(lastIndex), 'The traversal count is compromised when tank.go() directs the same Panzer instance, via a postback.');
 });