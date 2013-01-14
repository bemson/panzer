describe( 'Package members', function () {

  var
    Klass,
    pkgDef
  ;

  beforeEach(function () {
    Klass = Panzer.create();
    pkgDef = Klass.pkg('a');
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
        .every(function (val) {return typeof val === 'function'})
        .should.be.ok;
    });

  });

  describe( '.index', function () {

    it( 'should reflect the zero-based position of a package', function () {
      var pkgB = Klass.pkg('b');
      pkgDef.index
        .should.equal(0)
        .and.satisfy(function (index) {
          return pkgB.index - 1 === index;
        });

      Klass.pkg().indexOf('b').should.equal(pkgB.index);
    });

  });

});