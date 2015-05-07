describe( 'Package', function () {

  var
    Klass,
    pkgDef
  ;

  beforeEach(function () {
    Klass = Panzer.create();
    pkgDef = Klass.pkg('a');
  });

  it( 'should retrieve a corresponding package instance when passed a proxy', function () {
    pkgDef(new Klass()).should.be.an.instanceOf(pkgDef);
  });

  it( 'should falsy return value (otherwise)', function () {
    [null, true, false, 0, 1, {}, [], function () {}, undefined, '', 'abc', '!@#']
      .forEach(function (arg) {
        expect(pkgDef(arg)).to.not.be.ok;
      });
  });

  it( 'should return an empty instances when used as a constructor', function () {
   [null, true, false, 0, 1, {}, [], function () {}, undefined, '', 'abc', '!@#']
      .forEach(function (arg) {
        expect(new pkgDef(arg)).to.be.empty;
      });
     expect(new pkgDef()).to.be.empty;
  });

  it( 'should reflect the zero-based position of a package', function () {
    var pkgB = Klass.pkg('b');
    pkgDef.index
      .should.equal(0)
      .and.satisfy(function (index) {
        return pkgB.index - 1 === index;
      });

    Klass.pkg().indexOf('b').should.equal(pkgB.index);
  });

  it ('should reflect it\'s own label', function () {
    pkgDef.should.include.key('label');
    pkgDef.label.should.equal('a');
  });

  describe( '::getSuper()', function () {

    it( 'should retrieve the next method "up" the package-chain', function () {
      var
        pkgA = Klass.pkg('a'),
        pkgB = Klass.pkg('b'),
        pkgC = Klass.pkg('c')
      ;
      pkgA.proxy.foo = function () {};
      pkgC.proxy.foo = function () {};

      pkgC.getSuper('foo')
        .should.be.a('function')
        .and.equal(pkgA.proxy.foo);
    });

    it( 'should always return a function', function () {
      var
        noOp = pkgDef.getSuper('zee'),
        spy = sinon.spy(pkgDef, 'getSuper')
      ;
      pkgDef.getSuper();
      pkgDef.getSuper('bar')
        .should.be.a('function')
        .and.equal(noOp);
      [null, undefined, '', 'abc', 1, 0, true, false, function () {}, [], {}].forEach(function (arg) {
        pkgDef.getSuper(arg);
      });
      spy.returnValues
        .every(function (val) {return typeof val === 'function';})
        .should.be.ok;
    });

  });

  describe( '::on()', function () {

    it( 'should be chainable', function () {
      pkgDef.on.should.be.a('function');
      pkgDef.on().should.equal(pkgDef);
      pkgDef.on(null).should.equal(pkgDef);
      pkgDef.on('howdy').should.equal(pkgDef);
      pkgDef.on('howdy', function () {}).should.equal(pkgDef);
    });

    it( 'should bind functions to panzer events', function () {
      var
        begin = sinon.spy(),
        begin2 = sinon.spy(),
        pkgInst = pkgDef(new Klass())
      ;

      pkgDef.on('begin', begin);
      pkgInst.tank.go();

      begin.should.have.been.calledOnce;

      pkgDef.on('begin', begin2);
      pkgInst.tank.go();

      begin.should.have.been.calledTwice;
      begin2.should.have.been.calledOnce;
    });

    it( 'should scope functions to the package instance', function () {
      var
        spy = sinon.spy(),
        pkgInst = pkgDef(new Klass())
      ;

      pkgDef.on('begin', spy);
      pkgInst.tank.go();

      spy.should.have.been.calledOn(pkgInst);
    });

  });

  describe( '::off()', function () {

    it( 'should be chainable', function () {
      pkgDef.off.should.be.a('function');
      pkgDef.off().should.equal(pkgDef);
      pkgDef.off(null).should.equal(pkgDef);
      pkgDef.off('howdy').should.equal(pkgDef);
      pkgDef.off('howdy', function () {}).should.equal(pkgDef);
    });

    it( 'should remove all binds, when called with no arguments', function () {
      var
        spy1 = sinon.spy(),
        spy2 = sinon.spy(),
        tank = pkgDef(new Klass()).tank
      ;

      pkgDef
        .on('begin', spy1)
        .on('traverse', spy2)
      ;
      tank.go(1);

      spy1.should.have.been.called;
      spy2.should.have.been.called;
      spy1.reset();
      spy2.reset();

      pkgDef.off();

      tank.go(1);

      spy1.should.not.have.been.called;
      spy2.should.not.have.been.called;
    });

    it( 'should remove related binds when only given an event', function () {
      var
        spy1 = sinon.spy(),
        spy2 = sinon.spy(),
        tank = pkgDef(new Klass()).tank
      ;

      pkgDef
        .on('begin', spy1)
        .on('begin', spy2)
      ;
      tank.go();

      spy1.should.have.been.called;
      spy2.should.have.been.called;
      spy1.reset();
      spy2.reset();

      pkgDef.off('begin');

      tank.go();

      spy1.should.not.have.been.called;
      spy2.should.not.have.been.called;
    });

    it( 'should remove the bind matching the given event and function', function () {
      var
        spy1 = sinon.spy(),
        spy2 = sinon.spy(),
        tank = pkgDef(new Klass()).tank
      ;

      pkgDef
        .on('begin', spy1)
        .on('begin', spy2)
      ;
      tank.go();

      spy1.should.have.been.called;
      spy2.should.have.been.called;
      spy1.reset();
      spy2.reset();

      pkgDef.off('begin', spy1);
      tank.go();
      spy1.should.not.have.been.called;
      spy2.should.have.been.called;
    });

  });

});