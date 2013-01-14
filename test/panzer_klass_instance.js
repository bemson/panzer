describe( 'Klass Instance (Proxy)', function () {

  var
    Klass,
    fooPkg,
    barPkg,
    proxy
  ;

  before(function () {
    Klass = Panzer.create();
    fooPkg = Klass.pkg('foo');
    barPkg = Klass.pkg('bar');
    fooPkg.proxy.hello = function () {};
    barPkg.proxy.world = function () {};
    fooPkg.proxy.stub = function () {return false};
    barPkg.proxy.stub = function () {return true};
    proxy = new Klass();
  });

  it( 'should have a non-inherited, otherwise normal, .toString() method', function () {
    proxy.toString().should.equal(({}).toString());
    proxy.toString(12).should.equal(({}).toString(12));
  });

  it( 'should have methods prototyped by packages', function () {
    proxy.should.respondTo('hello');
    proxy.should.respondTo('world');
  });

  it( 'should ignore prototyped .toString members', function () {
    fooPkg.proxy.toString = function () {return 'hello';};
    fooPkg.proxy.tostring = function () {return 'world!';};
    proxy.toString().should.not.equal('hello');
    proxy.tostring().should.equal('world!');
  });

  it( 'should ignore prototyped .pkgs members', function () {
    fooPkg.proxy.pkgs = function () {};
    fooPkg.proxy.Pkgs = function () {};
    proxy.should.not.respondTo('pkgs');
    proxy.should.respondTo('Pkgs');
  });

  describe( '.pkgs', function () {

    it( 'should be an object exposing prototype links by package id', function () {
      proxy.stub().should.be.true;
      proxy.pkgs.bar.stub().should.be.true;
      proxy.pkgs.foo.stub().should.be.false;
    });

    it( 'should be available recursively via each package id', function () {
      proxy.pkgs.bar.should.contain.key('pkgs');
      proxy.pkgs.bar.pkgs.should.contain.key('bar');
    });

  });

});