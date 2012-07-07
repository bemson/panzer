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
  ok(Panzer.version.replace(/\./g, '') == +Panzer.version.replace(/\./g, ''), 'The Panzer.version represents a number, after removing the periods.');
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
    'The .toString() method always returns the result of "({}).toString()".'
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
    pkgA = 'a',
    pkgB = 'b',
    pkgDef = Klass.pkg(pkgA),
    pkgDef2 = Klass.pkg(pkgB),
    proxy = new Klass(),
    pkgInst = pkgDef(proxy),
    pkgInst2 = pkgDef2(proxy)
  ;
  ok(pkgInst.hasOwnProperty('nodes'), 'There is a non-inherited .nodes member.');
  ok(pkgInst.nodes instanceof Array, 'The .nodes member is an array.');
  ok(pkgInst.nodes !== pkgDef2(proxy).nodes, 'Each package-instance has a separate .nodes collection.');
  equal(pkgInst.nodes.length, 2, 'Two nodes are added to those parsed from the tree parameter.');
  ok(pkgInst.hasOwnProperty('proxy'), 'There is a non-inherited .proxy member.');
  ok(pkgInst.proxy === pkgDef2(proxy).proxy, 'The .proxy object is shared amongst package-instances.');
  ok(pkgInst.proxy === proxy, 'The .proxy object is the class instance.');
  ok(pkgInst.hasOwnProperty('tank'), 'There is a non-inherited .tank member.');
  equal(typeof pkgInst.tank, 'object', 'The .tank member is an object.');
  ok(pkgInst.tank === pkgDef2(proxy).tank, 'Package-instances share a single .tank object.');
  ok(pkgInst.pkgs[pkgA] === pkgInst && pkgInst.pkgs[pkgB] === pkgInst2, 'Package-instances reference all other package instances, after initialization.');
  equal(typeof pkgInst.pkgs, 'object', 'The .pkgs member is an object.');
  ok(pkgInst.pkgs === pkgDef2(proxy).pkgs, 'Package-instances share a single .pkgs object.');
  pkgDef.init = function () {
    ok(!this.pkgs.hasOwnProperty(pkgB), 'Newer package instances are not available during initialization.');
  };
  pkgDef2.init = function () {
    ok(this.pkgs.hasOwnProperty(pkgA), 'Older package instances are available during initialization.');
  };
  new Klass();
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
  'name|value|index|depth|tags|path|children|parentIndex|previousIndex|nextIndex|firstChildIndex|lastChildIndex|childIndex'.split('|')
    .forEach(function (mbr) {
      ok(node.hasOwnProperty(mbr), 'Has a "' + mbr + '" member.');
    });
  'PNULL|PROOT'.split('|')
    .forEach(function (name, idx) {
      equal(pkgInst.nodes[idx].name, name, 'By default, the name member of the node at index ' + idx + ' is "' + name + '".');
    });
  strictEqual(node.previousIndex, undefined, 'Unset .xxxIndex member properties are undefined.');
  ok(pkgInst.nodes[1].tags === pkgDef2(proxy).nodes[1].tags, 'Nodes at the same index, from different package-instances, reference the same .tags object.');
});

module('Tank API');

test('.go()', function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    pkgInst = pkgDef(new Klass({a:1, b:2})),
    tank = pkgInst.tank;
  equal(typeof tank.go, 'function', 'Has the .go() method.');
  equal(typeof tank.go(), 'number', 'Returns the number of traversals that occur during navigation.');
  pkgDef.init = function () {
    this.tank.go(1);
  };
  equal(pkgDef(new Klass()).tank.currentIndex, 1, 'tank.go() can called during package-instance initializing.');
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
    'Reflects the index of the last node the tree-pointer traversed.'
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

test('.index', function () {
  var
    Klass = Panzer.create(),
    pkgDefA = Klass.pkg('a'),
    pkgDefB = Klass.pkg('b');
  equal(typeof pkgDefA.index, 'number', 'Is a number');
  equal(pkgDefA.index, 0, 'The .index is zero-based.');
  equal(pkgDefA.index + 1, pkgDefB.index, 'The .index value increments by one with each newly defined package.');
});

test('.proxy', function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    pkgMthdName = 'foo',
    proxy = new Klass(),
    pkgInst = pkgDef(proxy);
  ok(pkgDef.proxy.isPrototypeOf(proxy), 'The Panzer instance prototype uses the .proxy member of package-definitions.');
  ok(
    'pkgs|toString|prototype'.split('|')
      .every(function (prop) {
        return pkgInst.proxy[prop] === proxy[prop];
      }),
    'The .proxy object shares the same members and prototype as the Panzer-instance.'
  );
  pkgDef.proxy[pkgMthdName] = function () {
    ok(this === proxy, 'The scope of .proxy methods is the Panzer instance.');
    ok(this.hasOwnProperty('pkgs'), 'The .pkgs member is available to methods from the .proxy member.');
    ok(this.hasOwnProperty('toString'), 'The .toString member is available to methods from the .proxy member.');
  };
  proxy[pkgMthdName]();
  ok(Klass.pkg('b').proxy[pkgMthdName], 'Each package extends upon the .proxy prototype chain of the last package.');
});

test('.init', function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    tree = ['any','js','object'],
    expandoProp = 'abc',
    expandoVal = {},
    nodeMbrName = 'foo',
    val = 0,
    pkgInst, initScope;
  equal(pkgDef.init, 0, 'Default value is 0.');
  pkgDef.init = function () {
    initScope = this;
    args = arguments;
    val++;
  };
  pkgInst = pkgDef(new Klass());
  equal(val, 1, 'The .init function is called during instantiation.');
  equal(args.length, 1, 'One argument is passed to the function.');
  equal(typeof args[0], 'object', 'The argument is an object.');
  pkgDef.init = function (cfg) {
    val = cfg === expandoVal;
  };
  new Klass(tree, expandoVal);
  pkgDef.init = function (cfg) {
    val = typeof cfg;
  };
  ok(val && ['non-object', 1, 0, function () {}].every(function (secondArgument) {
      new Klass('something', secondArgument);
      return typeof secondArgument !== val;
    }),
    'When the second parameter of a Panzer class is not an object, it is not passed the .init function.'
  );
  pkgDef.init = function (cfg) {
    ok(cfg === expandoVal, 'When the second parameter of a Panzer class is an object, it is passed through to the .init function.');
  };
  new Klass('something', expandoVal);
  ok(initScope === pkgInst, 'The scope of the .init function is the package-instance.');
  pkgDef.init = function () {
    ok(this.hasOwnProperty('tank'), 'The .tank member is available during initialization.');
    ok(this.hasOwnProperty('nodes'), 'The .nodes collection is available during initialization.');
    ok(!this.hasOwnProperty('proxy'), 'The .proxy member is not available during initialization.');
  };
  pkgInst = pkgDef(new Klass());
  ok(pkgInst.hasOwnProperty('proxy'), 'The .proxy member was added to the package-instance, after the .init function executed.');
  pkgDef.node[nodeMbrName] = expandoVal;
  pkgDef.init = function () {
    strictEqual(this.nodes[0][nodeMbrName], expandoVal, 'Members of the .node object are available to node instances within the .init function.');
  }
  new Klass();
});

test('.tagKey', function () {
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
  strictEqual(pkgDef.tagKey, 0, 'The default value is 0.');
  equal(pkgDef(new Klass(treeParam)).nodes.length, allAsNodes, 'By default, all keys become nodes.');
  ok(
    [null, undefined, 1, '', {}, []].every(function (value) {
      pkgDef.tagKey = value;
      return pkgDef(new Klass(treeParam)).nodes.length === allAsNodes;
    }),
    'All keys become nodes when set to anything besides a function or regular expression.'
  );
  pkgDef.tagKey = /\d/;
  equal(pkgDef(new Klass(treeParam)).nodes.length, allAsNodes, 'A non-matching regular expression allows all keys to become nodes.');
  pkgDef.tagKey = /^_/;
  pkgInst = pkgDef(new Klass(treeParam));
  equal(pkgInst.nodes.length, allAsNodes - 2, 'A matching regular expression reduces the number of keys that become nodes.');
  ok(
    pkgInst.nodes[1].tags.hasOwnProperty('_foo') && pkgInst.nodes[1].tags.hasOwnProperty('_bar'),
    'Keys that match a regular expression, become tags of their parent node.'
  );
  pkgDef.tagKey = function (name, value) {
    scope = this;
    args = arguments;
  };
  pkgInst = pkgDef(new Klass({oneKey: randValue}));
  ok(scope === window, 'Functions execute in the global scope.');
  equal(args.length, 2, 'Functions receives two arguments.');
  equal(typeof args[0], 'string', 'The first argument given to functions is the key name, a string.');
  equal(pkgInst.nodes.length, 3, 'All keys become nodes when a function returns nothing or a falsy value.');
  val = 0;
  pkgDef.tagKey = function () {
    val = 1;
  };
  new Klass();
  new Klass({});
  new Klass('');
  new Klass(1);
  equal(val, 0, 'Functions are not fired when there are no keys to parse.');
  pkgDef.tagKey = function (name, value) {
    return value < 3;
  };
  pkgInst = pkgDef(new Klass(treeParam));
  equal(pkgInst.nodes.length, allAsNodes - 2, 'When a function returns true, fewer keys are parsed into nodes.');
  ok(
    pkgInst.nodes[1].tags.hasOwnProperty('foo') && pkgInst.nodes[1].tags.hasOwnProperty('bar'),
    'When a function returns true, a key becomes a tag of the node parsed from the lexical context.'
  );
  pkgDef.tagKey = function () {
    pkgDef.tagKey = 0;
    return true;
  };
  pkgInst = pkgDef(new Klass(treeParam));
  equal(pkgInst.nodes.length, 2, 'The .tagKey function is cached during compilation.');
});

test('.badKey', function () {
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
  strictEqual(pkgDef.badKey, 0, 'The default value is 0.');
  equal(pkgDef(new Klass(treeParam)).nodes.length, allAsNodes, 'By default, all keys become nodes.');
  ok(
    [null, undefined, 1, '', {}, []].every(function (value) {
      pkgDef.badKey = value;
      return pkgDef(new Klass(treeParam)).nodes.length === allAsNodes;
    }),
    'All keys become nodes when set to anything besides a function or regular expression.'
  );
  pkgDef.badKey = /\d/;
  equal(pkgDef(new Klass(treeParam)).nodes.length, allAsNodes, 'A non-matching regular expression allows all keys to become nodes.');
  pkgDef.badKey = /^_/;
  pkgInst = pkgDef(new Klass(treeParam));
  equal(pkgInst.nodes.length, allAsNodes - 2, 'A matching regular expression reduces the number of keys that become nodes.');
  pkgDef.badKey = function (name, value) {
    scope = this;
    args = arguments;
  };
  pkgInst = pkgDef(new Klass({oneKey: randValue}));
  ok(scope === window, 'Functions execute in the global scope.');
  equal(args.length, 2, 'Functions receives two arguments.');
  equal(typeof args[0], 'string', 'The first argument given to functions is the key name, a string.');
  equal(pkgInst.nodes.length, 3, 'All keys become nodes when a function returns nothing or a falsy value.');
  val = 0;
  pkgDef.badKey = function () {
    val = 1;
  };
  new Klass();
  new Klass({});
  new Klass('');
  new Klass(1);
  equal(val, 0, 'Functions are not fired when there are no keys to parse.');
  pkgDef.badKey = function (name, value) {
    return value < 3;
  };
  pkgInst = pkgDef(new Klass(treeParam));
  equal(pkgInst.nodes.length, allAsNodes - 2, 'When a function returns true, fewer keys are parsed into nodes.');
  pkgDef.badKey = function () {
    pkgDef.badKey = 0;
    return true;
  };
  pkgInst = pkgDef(new Klass(treeParam));
  equal(pkgInst.nodes.length, 2, 'The .badKey function is cached during compilation.');
});

test('.prepTree', 7, function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    value = {},
    value2 = {}
  ;
  strictEqual(pkgDef.prepTree, 0, 'The default value is 0.');
  ok(
    [0, {}, [], /m/, 1, '', 'foo', null, undefined].every(function (param) {
      pkgDef.prepTree = param;
      return pkgDef(new Klass(value)).nodes[1].value == value;
    }),
    'Set to anything but a function has no effect.'
  );
  pkgDef.prepTree = function (arg) {
    equal(arguments.length, 1, 'The function is passed one argument.');
    ok(1, 'As a function package.prepTree is executed once per Panzer instance.');
    strictEqual(arg, value, 'The function is passed the original initialization object.');
    return value2;
  };
  strictEqual(pkgDef(new Klass(value)).nodes[1].value, value2, 'The value returned becomes the value parsed.');
  pkgDef.prepTree = function () {
    return value2;
  };
  Klass.pkg('b').prepTree = function (arg) {
    strictEqual(arg, value2, 'Each package-definition alters or returns the value passed to the next package\'s .prepTree function.');
  };
  new Klass();
});

test('.prepNode', function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    value = {},
    value2 = {a: value},
    value3 = {},
    cnt = 0,
    key = 'foo'
  ;
  strictEqual(pkgDef.prepNode, 0 , 'The default value is 0.');
  ok(
    [0, {}, [], /m/, 1, '', 'foo', null, undefined].every(function (param) {
      pkgDef.prepNode = param;
      return pkgDef(new Klass(value)).nodes[1].value == value;
    }),
    'Set to anything but a function has no effect.'
  );
  pkgDef.prepNode = function () {
    cnt++;
  };
  ok(
    [0, {}, [], /m/, 1, '', 'foo', null, undefined].every(function (param) {
      new Klass(param);
      return !cnt;
    }),
    'The .prepNode function does not execute the initialization tree has no child members.'
  );
  new Klass({a:1,b:1});
  equal(cnt, 2, 'Executes once per child member of the initialization object.');
  pkgDef.prepNode = function (node, tree) {
    equal(arguments.length, 2, 'The function receives two arguments.');
    strictEqual(node, value, 'The first argument is the value of the child member.');
    strictEqual(tree, value2, 'The second argument is the initialization object.');
  };
  new Klass(value2);
  pkgDef.prepNode = 0;
  cnt = pkgDef(new Klass(value2)).nodes.length;
  ok(
    [0, 1, 'foo', true, false, undefined, {}, [], null].every(function (arg) {
      pkgDef.prepNode = function () {
        return arg;
      };
      return pkgDef(new Klass(value2)).nodes.length === cnt;
    }),
    'Returning non-object values or non-member objects does not impact the parsed Panzer instance tree.'
  );
  cnt = 0;
  pkgDef.prepNode = function (node, tree) {
    if (!cnt++) {
      return {a: key};
    }
  };
  equal(pkgDef(new Klass(value2)).nodes[3].value, key, 'Children of the returned object are added to the parsed Panzer tree.');
  cnt = 0;
  pkgDef.prepNode = function (node, tree) {
    if (cnt < 2) {
      cnt++;
      return value2;
    }
  };
  new Klass(value2);
  equal(cnt, 2, 'If a returned object has members, they are also processed by .prepNode.');
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

test('.getSuper()', function () {
  var
    Klass = Panzer.create(),
    pkgDefA = Klass.pkg('a'),
    pkgDefB = Klass.pkg('b'),
    pkgDefC = Klass.pkg('c'),
    someFnc = function () {};
  equal(typeof pkgDefA.getSuper, 'function', 'This is a function.');
  ok(
    [1,'', 'foo', 'bar', undefined, null, {}, function () {}, []].every(
      function (arg) {
        return pkgDefB.getSuper(arg) === false;
      }
    ),
    'Returns false when given a non/empty string argument.'
  );
  pkgDefA.proxy.foo = someFnc;
  pkgDefC.proxy.foo = function () {};
  equal(pkgDefC.getSuper('foo'), pkgDefA.proxy.foo, 'Returns the proxy method defined in earlier packages.');
  delete pkgDefA.proxy;
  equal(pkgDefC.getSuper('foo'), someFnc, 'Reads the private prototype, not the .proxy member of the pakage-definition.');
});

module('Structure');

test('Key Parsing', function () {
  var
    Klass = Panzer.create(),
    pkgDef1 = Klass.pkg('a'),
    pkgDef2 = Klass.pkg('b'),
    tree = {
      an: 'object',
      to: {
        parse: 'in to',
        nodes: "n'",
        ta: '-gs'
      },
      based: 'on',
      "it's": 'keys',
      or: 'values'
    },
    val = '',
    proxy;
  pkgDef1.tagKey = pkgDef2.badKey = /./;
  equal(pkgDef1(new Klass(tree)).nodes.length, 2, 'Keys matching an .badKey test, can not become tags.');
  pkgDef1.badKey = pkgDef1.tagKey = 0;
  pkgDef2.badKey = function () {
    val += 'a';
    return false;
  };
  pkgDef2.tagKey = function () {
    val += 'b';
    return false;
  };
  new Klass(tree);
  equal(val.substr(0,2), 'ab', 'Keys are matched with the .badKey member before the .tagKey member.');
  val = '';
  pkgDef2.badKey = /./;
  new Klass(tree);
  equal(val, '', 'Per key, when an .badKey test matches, the .tagKey test is skipped.');
  pkgDef2.badKey = 0;
  pkgDef2.tagKey = function () {
    return true;
  };
  pkgDef1.tagKey = function () {
    return false;
  };
  equal(pkgDef2(new Klass(tree)).nodes.length, 2, 'Matching .tagKey and .badKey tests overrule failing ones (from other packages).');
  pkgDef2.tagKey = 0;
  pkgDef1.tagKey = /parse|nodes|ta/;
  deepEqual(pkgDef1(new Klass(tree)).nodes[3].tags, tree.to, 'Keys passing the .tagKey test, become tags to their container node.');
  pkgDef2.badKey = function (name, value) {
    return /^\-/.test(value);
  };
  equal(JSON.stringify(pkgDef2(new Klass(tree)).nodes), JSON.stringify(pkgDef1(new Klass(tree)).nodes), 'Each package receives with the same tree, composited from all .tagKey and .badKey tests.');
});

test('Package-instance', function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    pkgDef2 = Klass.pkg('b'),
    someMbr = 'somename',
    someMbrValue = {};
  pkgDef.init = function () {
    this[someMbr] = someMbrValue;
  };
  strictEqual(pkgDef(new Klass())[someMbr], someMbrValue, 'Members added via the .init function are present in the package-instance.');
  ok(!pkgDef2(new Klass()).hasOwnProperty(someMbr), 'Adding instance members in one package, does not impact other packages.');
});

test('Nodes', function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    pkgDef2 = Klass.pkg('b'),
    someMbr = 'somename',
    someMbrValue = {},
    pkgInst, val;
  pkgDef.init = function () {
    this.nodes.forEach(function (node) {
      node[someMbr] = someMbrValue;
    });
  };
  strictEqual(pkgDef(new Klass()).nodes[0][someMbr], someMbrValue, 'Members added to nodes in the .nodes collection, via the .init function, are present in the package-instance.');
  ok(!pkgDef2(new Klass()).nodes[0].hasOwnProperty(someMbr), 'Adding nodal members in one package, does not impact other packages.');
  pkgDef.init = function () {
    this.nodes.push(this.nodes[0]);
  };
  pkgInst = pkgDef(new Klass());
  val = pkgInst.tank.currentIndex;
  pkgInst.tank.go(pkgInst.nodes.length - 1);
  equal(pkgInst.tank.currentIndex, val, 'Adding to the .nodes collection does not add navigable tree-nodes.');
  pkgDef.init = function () {
    delete this.nodes;
  };
  equal(pkgDef(new Klass()).tank.go(1), 2, 'Nodes of a package-instance can be manipulated without impacting the range of navigable nodes.');
});

module('Navigation');

test('Events', 5, function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    pkgDef2 = Klass.pkg('b'),
    vals = [],
    rand = Math.random(),
    pkgInst = pkgDef(new Klass()),
    tank = pkgInst.tank;
  pkgDef.onBegin = pkgDef.onTraverse = pkgDef.onEnd = function (evt) {
    vals.push(evt);
  };
  tank.go(0);
  deepEqual(vals, 'begin|traverse|end'.split('|'), 'Traversal events occur in the expected order.');
  pkgDef.onBegin = function (evt) {
    vals = [evt];
    tank.stop();
  };
  equal(tank.go(1), 0, 'The "traverse" event does not fire when navigation is stopped during the "begin event.');
  deepEqual(vals, 'begin|end'.split('|'), 'The "begin" and "end" events fire when stopping navigation from the begin-callback.');
  pkgDef.onBegin = function (evt) {
    vals = 1;
  };
  pkgDef.onTraverse = 0;
  pkgDef.onEnd = function () {
    vals++;
  };
  tank.go();
  equal(vals, 2, 'The "begin" and "end" events fire when calling tank.go() with no arguments.');
  pkgDef.onBegin = pkgDef.onEnd = 0;
  pkgDef2.onTraverse = function () {
    vals = rand;
  };
  pkgDef(new Klass()).tank.go(1);
  equal(vals, rand, 'All package callbacks fire, regardless of which package invokes tank.go().');
});

test('Tree-Pointer', 27, function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    pkgInst = pkgDef(new Klass([['child','nodes'],'sibling','nodes'])),
    tank = pkgInst.tank,
    evts = [];

  pkgDef.onBegin = function () {
    evts = [];
  };
  pkgDef.onTraverse = function (evt, type) {
    evts.unshift([type, this.tank.currentIndex]);
  };
  tank.go(0);
  tank.go(1);
  equal(evts.length, 2, 'Navigating from a parent to a child node, results in two traversal events.');
  deepEqual(evts.pop(), [1, 1], 'The first event signals when the tree-pointer enters the child node target.');
  deepEqual(evts.pop(), [0, 1], 'The second event signals when the tree-pointer centers on the child node target.');
  tank.go(1);
  tank.go(0);
  equal(evts.length, 2, 'Navigating from a child to a parent node, results in two traversal events.');
  deepEqual(evts.pop(), [2, 1], 'The first event signals when the tree-pointer exits the child node.');
  deepEqual(evts.pop(), [0, 0], 'The second event signals when the tree-pointer centers on the parent node target.');
  tank.go(2);
  tank.go(5);
  equal(evts.length, 3, 'Navigating from one node to it\'s sibling, results in three traversal events.');
  deepEqual(evts.pop(), [2, 2], 'The first event signals when the tree-pointer exits the current node.');
  deepEqual(evts.pop(), [1, 5], 'The second event signals when the tree-pointer enters the sibling node target.');
  deepEqual(evts.pop(), [0, 5], 'The third event signals when the tree-pointer centers on the sibling node target.');
  tank.go(2);
  tank.go(6);
  equal(evts.length, 4, 'Navigating from one node to a right, non-adjacent sibling, results in at least four traversal events.');
  deepEqual(evts.pop(), [2, 2], 'The first event signals when the tree-pointer exits the current node.');
  deepEqual(evts.pop(), [3, 5], 'Traversal events are fired for every intermediary node that the tree-pointer forward-bypasses.');
  deepEqual(evts.pop(), [1, 6], 'The third event signals when the tree-pointer enters the target node.');
  deepEqual(evts.pop(), [0, 6], 'The fourth event signals when the tree-pointer centers on the target node.');
  tank.go(6);
  tank.go(2);
  equal(evts.length, 4, 'Navigating from one node to a left, non-adjacent sibling, results in at least four traversal events.');
  deepEqual(evts.pop(), [2, 6], 'The first event signals when the tree-pointer exits the current node.');
  deepEqual(evts.pop(), [4, 5], 'Traversal events are fired for every intermediary node that the tree-pointer backward-bypasses.');
  deepEqual(evts.pop(), [1, 2], 'The third event signals when the tree-pointer enters the target node.');
  deepEqual(evts.pop(), [0, 2], 'The fourth event signals when the tree-pointer centers on the target node.');
  tank.go(5);
  tank.go(1);
  equal(evts.length, 3, 'Navigating from an n-th child to it\'s parent node, results in at least three traversal events.');
  deepEqual(evts.pop(), [2, 5], 'The first event signals when the tree-pointer exits the n-th child node.');
  deepEqual(evts.pop(), [4, 2], 'Traversal events are fired for every intermediary node that the tree-pointer backward-bypasses.');
  deepEqual(evts.pop(), [0, 1], 'The third event signals when the tree-pointer centers on the parent node.');

  pkgDef.onBegin = pkgDef.onTraverse = evts = 0;
  pkgDef.onTraverse = function () {
    evts++;
  }
  equal(tank.go(1), evts, 'tank.go() returns the number of traversal events fired during navigation.');

  pkgDef.onTraverse = 0;
  equal(tank.go(1), 1, 'tank.go() returns 1 when the tree-pointer is already centered on the target node.');
  tank.go(0);
  pkgDef.onTraverse = function (evt, type) {
    if (type === 1) {
      this.tank.stop();
    }
  };
  tank.go(6);
  ok(tank.go() > 0, 'When the tree-pointer is not at rest (i.e., "centered"), calling tank.go() with no arguments is the same as passing the index of the last node target.');
});

test('Routing', 4, function () {
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

test('Postbacks', 3, function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    pkgInst = pkgDef(new Klass(['any','js','object'])),
    tank = pkgInst.tank,
    val = 0,
    lastIndex = pkgInst.nodes.length - 1,
    tgtIndex = 1,
    postId;
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
});

module('Behavior');

test('Default Tree-Pointer', 2, function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    tree = ['any','js','object'],
    tgtIdx = 3,
    val = 0;
  pkgDef.init = function () {
    this.tank.go(tgtIdx);
  };
  equal(pkgDef(new Klass(tree)).tank.currentIndex, tgtIdx, 'Calling tank.go() during package-instance initialization will change initial tank.currentIndex.');
  pkgDef.onBegin = pkgDef.onTraverse = pkgDef.onEnd = function () {
    val++;
  }
  equal(val, 0, 'tank.go() does not trigger navigation events when called during package-instance initialization.');
});

test('Tank API Interactions', 8, function() {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    val, pkgInst;
  strictEqual(pkgDef(new Klass()).tank.stop(), false, 'tank.stop() returns false when called outside an event callback.');

  ok('onBegin|onTraverse|onEnd'.split('|')
    .every(function (evtName) {
      var
        stopRtnVal;
      pkgDef[evtName] = function () {
        stopRtnVal = this.tank.stop();
      };
      pkgDef(new Klass()).tank.go(0);
      pkgDef[evtName] = 0;
      return stopRtnVal === true;
    }),
    'tank.stop() returns true when called from all callback functions.'
  );

  pkgInst = pkgDef(new Klass());
  val = 1;
  pkgDef.onBegin = function () {
    equal(this.tank.targetIndex, val, 'tank.targetIndex matches the integer passed to the originating tank.go() call.');
    this.tank.stop();
  };
  pkgInst.tank.go(val);
  equal(pkgInst.tank.targetIndex, val, 'tank.targetIndex is preserved when navigation is stopped.');
  pkgDef.onBegin = 0;

  pkgDef.onEnd = function () {
    this.tank.stop();
  };
  pkgInst.tank.go();
  deepEqual([pkgInst.tank.currentIndex, pkgInst.tank.targetIndex], [val, -1], 'Calling tank.stop() during an "end" event has no impact on the tree-pointer.');
  pkgDef.onEnd = 0;

  pkgInst.tank.go(0);
  pkgDef.onTraverse = function (evt, type) {
    if (type === 0) {
      this.tank.stop();
    }
  };
  pkgInst.tank.go(val);
  deepEqual([pkgInst.tank.currentIndex, pkgInst.tank.targetIndex], [val, -1], 'Calling tank.stop() during a "traversal" event of type 0, has no impact on the tree-pointer.');
  pkgDef.onTraverse = 0;

  val = 0;
  pkgDef.onBegin = pkgDef.onTraverse = pkgDef.onEnd = function () {
    this.tank.stop();
    this.tank.go();
    val++;
  };
  pkgDef(new Klass()).tank.go(1);
  equal(val, 4, 'Within the callbacks, invoking tank.go() with no arguments nullifies prior calls to tank.stop().');
  pkgDef.onBegin = pkgDef.onTraverse = pkgDef.onEnd = 0;

  val = [0,1];
  pkgDef.onTraverse = function () {
    val[0] += 1;
  };
  pkgDef.onEnd = function () {
    var tank = this.tank;
    if (val[1]) {
      val[1] = 0;
      tank.post(
        function () {
          tank.go(0);
        }
      );
    }
  };
  ok(pkgDef(new Klass(['any', ])).tank.go() !== val[0], 'The traversal count - returned by tank.go() - is compromised when a callback sets a postback that also calls tank.go().');
});

test('Event Callbacks', 1, function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    cut = 0,
    normal = 0;
  pkgDef.onTraverse = function () {
    normal++;
  };
  pkgDef(new Klass()).tank.go(1);
  pkgDef.onTraverse = function () {
    cut++;
    pkgDef.onTraverse = 0;
  };
  pkgDef(new Klass()).tank.go(1);
  ok(cut < normal, 'Package callbacks are not cached, and may be cached during navigation.');
});

test('Package-Instance', 2, function () {
  var
    Klass = Panzer.create(),
    pkgDef = Klass.pkg('a'),
    val = {};
  pkgDef.init = function () {
    ok(!this.hasOwnProperty('proxy'), 'The .proxy member is not present during package-instance initialization.');
  };
  new Klass();
  pkgDef.init = function () {
    this.proxy = val;
  };
  ok(pkgDef(new Klass()).proxy !== val, 'The .proxy member is set/overwritten after the package-instance initialized.');
});

test('Panzer-Instance/Proxy Methods', 6, function () {
  var
    Klass = Panzer.create(),
    pkgDef1 = Klass.pkg('a'),
    pkgDef2 = Klass.pkg('b'),
    mthdName = 'foo',
    val = 0,
    mthd1 = function () {
      ok(val, 'The last defined package has precedence over proxy method names.');
      ok(pkgDef2(this).proxy !== this, 'The scope of "<Proxy>.pkgs.<PackageName>" methods is not the public proxy.');
      ok(pkgDef1(this) && pkgDef2(this), 'The scope of "<Proxy>.pkgs.<PackageName>" methods can be used to access any package-instance.');
    },
    mthd2 = function () {
      val++;
      ok(this.pkgs.a[mthdName], 'Any proxy method can access the proxy methods of other packages.');
      this.pkgs.a[mthdName]();
    };
  ok((new Klass()).pkgs.a, '<Proxy>.pkgs member references all package proxy methods by name.');
  ok((new Klass()).pkgs.a.pkgs.a, 'Each <Proxy>.pkgs member has a recursive reference to the "pkgs".');
  pkgDef1.proxy[mthdName] = mthd1;
  pkgDef2.proxy[mthdName] = mthd2;
  (new Klass())[mthdName]();
});