describe( 'Package ', function () {

  var Klass, pkgDef;

  beforeEach(function () {
    Klass = Panzer.create();
    pkgDef = Klass.pkg('a');
  });

  describe( 'definition', function () {

    it( 'should be a function', function () {
      pkgDef = Klass.pkg('foo');
      pkgDef.should.be.a('function');
    });

    it( 'should return an empty instance when used as a constructor', function () {
      [new Klass(), null, true, false, 0, 1, {}, [], function () {}, undefined, '', 'abc', '!@#']
        .forEach(function (arg) {
          expect(new pkgDef(arg)).to.be.empty;
        });
      expect(new pkgDef()).to.be.empty;
    });

    it( 'should return false, when passed anything but a proxy instance', function () {
      expect(pkgDef()).to.not.be.ok;

      [null, true, false, 0, 1, {}, [], function () {}, undefined, '', 'abc', '!@#']
        .forEach(function (arg) {
          expect(pkgDef(arg)).to.not.be.ok;
        });
    });

    describe( 'when given a proxy', function () {

      it( 'should return a package instance', function () {
        var proxy = new Klass();

        pkgDef(proxy).should.be.an.instanceOf(pkgDef);
      });

      describe( 'created before it was defined', function () {

        it( 'should return false', function () {
          var
            pkgEarly = Klass.pkg('defined before proxy'),
            proxy = new Klass(),
            pkgLate = Klass.pkg('defined after proxy')
          ;

          pkgEarly(proxy).should.be.ok;

          pkgLate(proxy).should.not.be.ok;
        });

      });

      describe( 'from a different Panzer class', function () {

        it( 'should return false', function () {
          var
            KlassWithEmptyPkg = Panzer.create(),
            KlassWithSamePkgCnt = Panzer.create()
            KlassWithGreaterPkgCnt = Panzer.create()
          ;

          KlassWithSamePkgCnt.pkg('a');

          KlassWithGreaterPkgCnt.pkg('a');
          KlassWithGreaterPkgCnt.pkg('b');

          pkgDef(new KlassWithEmptyPkg()).should.not.be.ok;
          pkgDef(new KlassWithSamePkgCnt()).should.not.be.ok;
          pkgDef(new KlassWithGreaterPkgCnt()).should.not.be.ok;
        });

      });

      describe( 'with delayed parsing', function () {

        beforeEach(function () {
          pkgDef.prepNode = function () {
            return Promise.resolve();
          };
        });

        it( 'should return false', function () {
          expect(pkgDef(new Klass())).to.be.false;
        });

      });

      describe( 'with delayed initialization', function () {

        beforeEach(function () {
          pkgDef.on('init', function () {
            return Promise.resolve();
          });
        });

        it( 'should return false', function () {
          expect(pkgDef(new Klass())).to.be.false;
        });

      });

    });

  });

  describe( '::index', function () {

    it( 'should be a static numeric member', function () {
      pkgDef.should.have.ownProperty('index');
      pkgDef.index.should.be.a('number');
    });

    it( 'should reflect the package creation index', function () {
      var
        pkgB = Klass.pkg('b'),
        pkgC = Klass.pkg('c')
      ;

      pkgB.index.should.equal(pkgDef.index + 1);
      pkgC.index.should.equal(pkgB.index + 1);
    });

    it( 'should start at 0', function () {
      var Klass = Panzer.create();

      Klass.pkg('first package').index.should.equal(0);
    });

  });

  describe( '::attrKey', function () {

    var source = {
      '$foo': 'bar',
      'pop_': 'lock',
      attr: 5
    };

    it( 'should be a static member that is initially falsy', function () {
      pkgDef.should.have.ownProperty('attrKey');
      pkgDef.attrKey.should.equal(0);
    });

    it( 'should parse attributes that match it as a regular expression', function () {
      var
        unparsedNodeTotal = pkgDef(new Klass(source)).nodes.length,
        parsedPkgInst
      ;

      pkgDef.attrKey = /_$/;

      parsedPkgInst = pkgDef(new Klass(source));

      parsedPkgInst.nodes.length.should.be.below(unparsedNodeTotal);
      parsedPkgInst.nodes[1].attrs
        .should.be.an('object')
        .and.have.keys('pop_');
    });

    it( 'should parse attributes that begin with it as a string', function () {
      var
        unparsedNodeTotal = pkgDef(new Klass(source)).nodes.length,
        parsedPkgInst
      ;

      pkgDef.attrKey = '$';

      parsedPkgInst = pkgDef(new Klass(source));

      parsedPkgInst.nodes.length.should.be.below(unparsedNodeTotal);
      parsedPkgInst.nodes[1].attrs
        .should.be.an('object')
        .and.have.keys('$foo');
    });

    it( 'should parse attributes that satisfy it as a function', function () {
      var
        unparsedNodeTotal = pkgDef(new Klass(source)).nodes.length,
        parsedPkgInst
      ;

      pkgDef.attrKey = function (name) { return name === 'attr'; };

      parsedPkgInst = pkgDef(new Klass(source));

      parsedPkgInst.nodes.length.should.be.below(unparsedNodeTotal);
      parsedPkgInst.nodes[1].attrs
        .should.be.an('object')
        .and.have.keys('attr');
    });


    it( 'should receive the node name and value, when a function', function () {
      var spy = sinon.spy();

      pkgDef.attrKey = spy;
      new Klass(source);

      spy.should.have.been.called;
      spy.firstCall.args
        .should.have.lengthOf(2)
        .and.deep.equal(['$foo', 'bar']);
    });

    it( 'should not be called when the source has no members', function () {
      var spy = sinon.spy();

      pkgDef.attrKey = spy;

      new Klass();
      [null, undefined, 'abc', 1, [], {}].forEach(function (arg) {
        new Klass(arg);
      });

      spy.should.not.have.been.called;
    });

    it( 'should impact tree compilation across packages', function () {
      var
        pkgB = Klass.pkg('a different package'),
        unparsedNodeTotal = pkgDef(new Klass(source)).nodes.length,
        parsedPkgInst
      ;

      pkgDef.attrKey = /_$/;
      pkgB.attrKey = '$';

      parsedPkgInst = pkgDef(new Klass(source));

      parsedPkgInst.nodes.length.should.be.below(unparsedNodeTotal);
      parsedPkgInst.nodes[1].attrs
        .should.be.an('object')
        .and.have.keys('$foo', 'pop_');
    });

  });

  describe( '::badKey', function () {

    var source = {
      '$foo': 'bar',
      'pop_': 'lock',
      oops: 5
    };

    function hasNodeNamed(name) {
      return function (node) {
        return node.name === name;
      };
    }

    it( 'should be a static member that is initially falsy', function () {
      pkgDef.should.have.ownProperty('badKey');
      pkgDef.badKey.should.equal(0);
    });

    it( 'should exclude nodes that match it as a regular expression', function () {
      pkgDef(new Klass(source)).nodes.some(hasNodeNamed('pop_')).should.be.true;

      pkgDef.badKey = /_$/;
      pkgDef(new Klass(source)).nodes.some(hasNodeNamed('pop_')).should.be.false;
    });

    it( 'should exclude nodes that begin with it as a string', function () {
      pkgDef(new Klass(source)).nodes.some(hasNodeNamed('$foo')).should.be.true;

      pkgDef.badKey = '$';
      pkgDef(new Klass(source)).nodes.some(hasNodeNamed('$foo')).should.be.false;
    });

    it( 'should exclude nodes that satisfy it as a function', function () {
      var nameToExclude = 'oops';
      pkgDef(new Klass(source)).nodes.some(hasNodeNamed('oops')).should.be.true;

      pkgDef.badKey = function (name) {
        return name === nameToExclude;
      };
      pkgDef(new Klass(source)).nodes.some(hasNodeNamed(nameToExclude)).should.be.false;
    });

    it( 'should receive the node name and value, when a function', function () {
      var spy = sinon.spy();

      pkgDef.badKey = spy;
      new Klass(source);

      spy.should.have.been.called;
      spy.firstCall.args
        .should.have.lengthOf(2)
        .and.deep.equal(['$foo', 'bar']);
    });

    it( 'should not be called when the source has no members', function () {
      var spy = sinon.spy();

      pkgDef.badKey = spy;

      new Klass();
      [null, undefined, 'abc', 1, [], {}].forEach(function (arg) {
        new Klass(arg);
      });

      spy.should.not.have.been.called;
    });

    it( 'should impact tree compilation across packages', function () {
      var
        pkgB = Klass.pkg('a different package'),
        pkgC = Klass.pkg('yet another package'),
        pkgInst = pkgDef(new Klass(source))
      ;

      pkgInst.nodes.some(hasNodeNamed('pop_')).should.be.true;
      pkgInst.nodes.some(hasNodeNamed('$foo')).should.be.true;
      pkgInst.nodes.some(hasNodeNamed('oops')).should.be.true;

      pkgDef.badKey = /_$/;
      pkgB.badKey = '$';
      pkgC.badKey = function (name) { return name === 'oops'; };

      pkgInst = pkgDef(new Klass(source));

      pkgInst.nodes.some(hasNodeNamed('pop_')).should.be.false;
      pkgInst.nodes.some(hasNodeNamed('$foo')).should.be.false;
      pkgInst.nodes.some(hasNodeNamed('oops')).should.be.false;
    });

  });

  describe( '::prepNode', function () {

    var
      source = {a:{more:{nodes:1}}},
      scalarValue = 'a scalar value'
    ;

    it( 'should be a static member that is initially falsy', function () {
      pkgDef.should.have.ownProperty('prepNode');
      pkgDef.prepNode.should.equal(0);
    });

    describe( 'as a function', function () {

      it( 'should be invoked during instantiation', function () {
        var spy = sinon.spy();

        pkgDef.prepNode = spy;

        new Klass();

        spy.should.have.been.called;
      });

      it( 'should be scoped to the global/window object', function () {
        var spy = sinon.spy();

        pkgDef.prepNode = spy;
        new Klass(source);

        spy.should.have.been.calledOn(typeof exports ? undefined : window);
      });

      it( 'should receive a node name', function () {
        var spy = sinon.spy(function (name) {
            name.should.be.a('string');
          });

        pkgDef.prepNode = spy;
        new Klass(source);

        spy.firstCall.args[0].should.equal('PROOT');
        spy.secondCall.args[0].should.equal('a');
        spy.thirdCall.args[0].should.equal('more');
      });

      it( 'should pass "PROOT" as the node name of the first call', function () {
        var spy = sinon.spy();

        pkgDef.prepNode = spy;
        new Klass(source);

        spy.firstCall.args[0].should.equal('PROOT');
      });

      it( 'should receive a node value', function () {
        var spy = sinon.spy(function (name, value) {
            expect(value).to.exist;
          });

        pkgDef.prepNode = spy;
        new Klass(source);

        spy.firstCall.args[1].should.equal(source);
        spy.secondCall.args[1].should.equal(source.a);
        spy.thirdCall.args[1].should.equal(source.a.more);
      });

      it( 'should receive the source object as the first value', function () {
        var spy = sinon.spy();

        pkgDef.prepNode = spy;
        new Klass(source);

        spy.firstCall.args[1].should.equal(source);
      });

      it( 'should receive `undefined` for the value when initialized without a source', function () {
        var spy = sinon.spy(function (name, value) {
            expect(value).to.equal(undefined);
          });

        pkgDef.prepNode = spy;
        new Klass();

        spy.should.have.been.called;
      });

      it( 'should receive a node index', function () {
        var spy = sinon.spy(function (name, value, index) {
          index.should.be.a('number');
        });

        pkgDef.prepNode = spy;
        new Klass({a:{b:1}});

        spy.firstCall.args[2].should.equal(1);
        spy.secondCall.args[2].should.equal(2);
        spy.thirdCall.args[2].should.equal(3);
      });

      it( 'should receive a node depth', function () {
        var spy = sinon.spy(function (name, value, index, depth) {
          depth.should.be.a('number');
        });

        pkgDef.prepNode = spy;
        new Klass({a:{b:1}});

        spy.firstCall.args[3].should.equal(1);
        spy.secondCall.args[3].should.equal(2);
        spy.thirdCall.args[3].should.equal(3);
      });

      it( 'should receive a node parent name, index, and depth', function () {
        var spy = sinon.spy(function (name, value, index, depth, parent) {
          expect(parent).to.be.an('object');
          parent.should.have.keys('name', 'index', 'depth');
          parent.name.should.be.a('string');
          parent.index.should.be.a('number');
          parent.depth.should.be.a('number');
        });

        pkgDef.prepNode = spy;
        new Klass();

        spy.should.have.been.called;
      });

      it( 'should receive the original, instantiation value', function () {
        var
          original = {},
          spy = sinon.spy()
        ;

        pkgDef.prepNode = spy;

        new Klass(original);

        spy.should.have.been.calledWithMatch(original);
      });

      it( 'should not change the node value, when returning a scalar value', function () {
        pkgDef.prepNode = function (name) {
          if (name === 'a') {
            return scalarValue;
          }
        };

        pkgDef(new Klass({a:5})).nodes[2].value.should.not.equal(scalarValue);
      });

      it( 'should alter the compiled branch by returning an object', function () {
        pkgDef(new Klass('foo')).nodes.length.should.equal(2);

        pkgDef.prepNode = function (name, value) {
          if (value === 'foo') {
            return { more: { nodes: 'blah' } };
          }
        };

        pkgDef(new Klass('foo')).nodes.length.should.be.above(2);
      });

      it( 'should exclude a branch by returning a scalar value', function () {
        pkgDef(new Klass(source)).nodes.length.should.equal(5);

        pkgDef.prepNode = function (name) {
          if (name === 'a') {
            return scalarValue;
          }
        };

        pkgDef(new Klass(source)).nodes.length.should.equal(3);
      });

      it( 'should have no impact when returning null or undefined', function () {
        pkgDef(new Klass(source)).nodes.length.should.equal(5);

        pkgDef.prepNode = function (name) {
          if (name === 'a') {
            return undefined;
          }
        };

        pkgDef(new Klass(source)).nodes.length.should.equal(5);

        pkgDef.prepNode = function (name) {
          if (name === 'a') {
            return null;
          }
        };

        pkgDef(new Klass(source)).nodes.length.should.equal(5);
      });

      it( 'should delay compilation with a promise', function () {
        var
          prepSpy = sinon.spy(),
          initSpy = sinon.spy()
        ;

        pkgDef.prepNode = prepSpy();
        pkgDef.on('init', initSpy);

        return Klass().then(function () {
          prepSpy.should.have.been.calledBefore(initSpy);
        });
      });

      it( 'should be invoked in the order package were defined', function () {
        var
          pkgB = Klass.pkg('foo'),
          spyPkg1 = sinon.spy(function () {
            trace.push(1);
          }),
          spyPkg2 = sinon.spy(function () {
            trace.push(2);
          }),
          trace = []
        ;

        pkgDef.prepNode = spyPkg1;
        pkgB.prepNode = spyPkg2;

        new Klass();

        spyPkg1.should.have.been.calledBefore(spyPkg2);
        trace.should.deep.equal([1,2]);
      });

      it( 'should retain call order with promises', function () {
        var
          pkgB = Klass.pkg('foo'),
          pkgC = Klass.pkg('bar'),
          trace = []
        ;

        pkgDef.prepNode = function () {
          trace.push(1);
        };
        pkgB.prepNode = function () {
          trace.push(2);
          return new Promise(function (resolve) {
            setTimeout(function () {
            trace.push(3);
              resolve();
            }, 5);
          });
        };
        pkgC.prepNode = function () {
          trace.push(4);
        };

        return Klass().then(function () {
          trace.should.deep.equal([1,2,3,4]);
        });
      });

    });

  });

  describe( '::cloneable', function () {

    var proxy;

    beforeEach(function () {
      proxy = new Klass();
    });

    it( 'should be a static member that is initially truthy', function () {
      pkgDef.should.have.ownProperty('cloneable');
      pkgDef.cloneable.should.be.ok;
    });

    it( 'should clone the proxy source when truthy', function () {
      var spy = sinon.spy();

      pkgDef.prepNode = spy;

      new Klass(proxy);

      spy.should.not.have.been.called;
    });

    it( 'should recompile the proxy source when falsy', function () {
      var spy = sinon.spy();

      pkgDef.prepNode = spy;
      pkgDef.cloneable = 0;

      new Klass(proxy);

      spy.should.have.been.called;
    });

    it( 'should recompile the proxy source when any package is falsy', function () {
      var
        spy = sinon.spy(),
        pkgB = Klass.pkg('foo')
      ;

      pkgDef.prepNode = spy;
      pkgDef.cloneable = 1;
      pkgB.cloneable = 0;

      new Klass(proxy);

      spy.should.have.been.called;
    });

    it( 'should clone the proxy source when all packages are truthy', function () {
      var
        spy = sinon.spy(),
        pkgB = Klass.pkg('foo')
      ;

      pkgDef.prepNode = spy;
      pkgDef.cloneable = 1;
      pkgB.cloneable = 1;

      new Klass(proxy);

      spy.should.have.been.called;
    });

  });

  describe( '::prototype', function () {

    var pkgDefB;

    beforeEach(function () {
      pkgDefB = Klass.pkg('foo');
    });

    it( 'should reflect members of the package instance', function () {
      var pkgInst = pkgDef(new Klass());

      pkgInst.should.not.respondTo('hello');

      pkgDef.prototype.hello = function () { return 'world'; };

      pkgInst.should.respondTo('hello');
    });

    it( 'should not reflect members of a different package instance', function () {
      var pkgInstB = pkgDefB(new Klass());

      pkgInstB.should.not.respondTo('hello');

      pkgDef.prototype.hello = function () { return 'world'; };

      pkgInstB.should.not.respondTo('hello');
    });

  });

  describe( '::klassFn', function () {

    it( 'should be a static member object', function () {
      pkgDef.should.have.ownProperty('klassFn');
      pkgDef.klassFn
        .should.be.an('object')
        .and.be.empty;
    });

    it( 'should be the prototype for proxy instances', function () {
      var
        pkgB = Klass.pkg('foo'),
        proxy = new Klass()
      ;

      pkgDef.klassFn.isPrototypeOf(proxy).should.be.ok;
      pkgB.klassFn.isPrototypeOf(proxy).should.be.ok;
    });

    it( 'should not be the prototype of proxies created before the package', function () {
      var
        proxy = new Klass(),
        pkgB = Klass.pkg('foo')
      ;

      pkgDef.klassFn.isPrototypeOf(proxy).should.be.ok;
      pkgB.klassFn.isPrototypeOf(proxy).should.not.be.ok;
    });

    it( 'should allow overriding same name members by new packages', function () {
      var
        pkgNewer = Klass.pkg('higher up the prototype chain'),
        proxy = new Klass()
      ;
      pkgDef.klassFn.foo = function () {};

      proxy.should.respondTo('foo');
      proxy.foo.should.equal(pkgDef.klassFn.foo);

      pkgNewer.klassFn.foo = function () {};
      proxy.foo.should.not.equal(pkgDef.klassFn.foo);
      proxy.foo.should.equal(pkgNewer.klassFn.foo);
    });

  });

  describe( '::getSuper()', function () {

    it( 'should be a static member method', function () {
      pkgDef.should.have.ownProperty('getSuper');
      pkgDef.getSuper.should.be.a('function');
    });

    it( 'should retrieve an overriden method, "down" the protoype-chain', function () {
      var
        olderPkg = Klass.pkg('a'),
        middlePkg = Klass.pkg('b'),
        youngerPkg = Klass.pkg('c')
      ;

      olderPkg.klassFn.foo = function () {};
      middlePkg.klassFn.anyOtherMethod = function () {};
      youngerPkg.klassFn.foo = function () {};

      (new Klass()).foo.should.equal(youngerPkg.klassFn.foo);

      youngerPkg.getSuper('foo')
        .should.be.a('function')
        .and.equal(olderPkg.klassFn.foo);
    });

    it( 'should return a function for non-existent methods', function () {
      pkgDef.getSuper('imaginaryMethod').should.be.a('function');
    });

    it( 'should always return a function', function () {
      pkgDef.getSuper().should.be.a('function');
      [null, undefined, '', 'abc', 1, 0, true, false, function () {}, [], {}]
        .forEach(function (arg) {
          pkgDef.getSuper(arg);
        });
    });

  });

  describe( '::on()', function () {

    it( 'should be a static member method', function () {
      pkgDef.should.have.ownProperty('on');
      pkgDef.on.should.be.a('function');
    });

    it( 'should be chainable', function () {
      pkgDef.on().should.equal(pkgDef);
      pkgDef.on(null).should.equal(pkgDef);
      pkgDef.on('howdy').should.equal(pkgDef);
      pkgDef.on('howdy', function () {}).should.equal(pkgDef);
    });

    it( 'should bind callbacks to panzer events', function () {
      var spy = sinon.spy();

      pkgDef.on('init', spy);
      new Klass();

      spy.should.have.been.calledOnce;
    });

    it( 'should bind a callback to an array of events', function () {
      var spy = sinon.spy();

      pkgDef.on(['init', 'begin', 'end'], spy);

      pkgDef(new Klass()).tank.go();

      spy.should.have.been.calledThrice;
    });

    it( 'should scope callbacks to the package instance', function () {
      var
        spy = sinon.spy(),
        pkgInst
      ;

      pkgDef.on('init', spy);
      pkgInst = pkgDef(new Klass());

      spy.should.have.been.calledOn(pkgInst);
    });

    describe( 'execution', function () {
      var
        pkg1,
        pkg2,
        pkg3
      ;

      beforeEach(function () {
        Klass = Panzer.create();
        pkg1 = Klass.pkg('a');
        pkg2 = Klass.pkg('b');
        pkg3 = Klass.pkg('c');
      });

      it( 'should execute in the order that packages were defined', function () {
        var
          spy1 = sinon.spy(),
          spy2 = sinon.spy(),
          spy3 = sinon.spy()
        ;

        pkg1.on('init', spy1);
        pkg2.on('init', spy2);
        pkg3.on('init', spy3);

        new Klass();

        spy1.should.have.been.calledBefore(spy2);
        spy2.should.have.been.calledBefore(spy3);
      });

    });

  });

  describe( '::off()', function () {

    it( 'should be a static member method', function () {
      pkgDef.should.have.ownProperty('off');
      pkgDef.off.should.be.a('function');
    });

    it( 'should not remove events of other packages', function () {
      var
        pkgA = Klass.pkg('foo'),
        spyInit1 = sinon.spy(),
        spyInit2 = sinon.spy()
      ;

      pkgDef.on('init', spyInit1);
      pkgA.on('init', spyInit2);

      new Klass();

      spyInit1.should.have.been.calledOnce;
      spyInit2.should.have.been.calledOnce;

      pkgA.off();

      new Klass();

      spyInit1.should.have.been.calledTwice;
      spyInit2.should.have.been.calledOnce;
    });

    it( 'should be chainable', function () {
      pkgDef.off().should.equal(pkgDef);
      pkgDef.off(null).should.equal(pkgDef);
      pkgDef.off('howdy').should.equal(pkgDef);
      pkgDef.off('howdy', function () {}).should.equal(pkgDef);
    });

    it( 'should remove all callbacks, when called with no arguments', function () {
      var
        spy1 = sinon.spy(),
        spy2 = sinon.spy()
      ;

      pkgDef
        .on('init', spy1)
        .on('begin', spy2)
      ;
      pkgDef(new Klass()).tank.go();

      spy1.should.have.been.calledOnce;
      spy2.should.have.been.calledOnce;

      pkgDef.off();
      pkgDef(new Klass()).tank.go();

      spy1.should.have.been.calledOnce;
      spy2.should.have.been.calledOnce;
    });

    it( 'should remove all callbacks bound to the given event name', function () {
      var
        spyBegin = sinon.spy(),
        spyEnd = sinon.spy(),
        tank = pkgDef(new Klass()).tank
      ;

      pkgDef
        .on('begin', spyBegin)
        .on('end', spyEnd)
      ;
      tank.go();

      pkgDef.off('begin');
      tank.go();

      spyBegin.should.have.been.calledOnce;
      spyEnd.should.have.been.calledTwice;
    });

    it( 'should remove the callback bound to an event and function', function () {
      var
        spy1 = sinon.spy(),
        spy2 = sinon.spy()
      ;

      pkgDef
        .on('init', spy1)
        .on('init', spy2)
      ;

      new Klass();

      spy1.should.have.been.calledOnce;
      spy2.should.have.been.calledOnce;

      pkgDef.off('init', spy1);

      new Klass();

      spy1.should.have.been.calledOnce;
      spy2.should.have.been.calledTwice;
    });

    it( 'should remove a specific handler without impacting the callback queue', function () {
      var
        spy1 = sinon.spy(function () {
          pkgDef.off('init', spy1);
        }),
        spy2 = sinon.spy()
      ;

      pkgDef
        .on('init', spy1)
        .on('init', spy2)
      ;

      new Klass();

      spy1.should.have.been.called;
      spy2.should.have.been.called;
    });

  });

});