describe( 'Package Instance', function () {

  var
    Klass,
    proxy,
    pkgDef,
    pkgDefB,
    pkgInst,
    pkgInstB,
    stuffObj = [],
    stuff = {'a':1,'a2':'foo', 'c': stuffObj}
  ;

  beforeEach(function () {
    Klass = Panzer.create();
    pkgDef = Klass.pkg('a');
    pkgDefB = Klass.pkg('b');
    proxy = new Klass(stuff);
    pkgInst = pkgDef(proxy);
    pkgInstB = pkgDefB(proxy);
  });

  it( 'should have methods prototyped by the package definition function', function () {
    pkgInst.should.not.respondTo('foo');
    pkgDef.prototype.foo = function () {};
    pkgInst.should.respondTo('foo');
  });

  it( 'should have a .proxy member that is the Klass instance', function () {
    pkgInst.proxy.should.equal(proxy);
    pkgInstB.proxy.should.equal(proxy);
  });

  describe( '.pkgs', function () {

    it( 'should access other package-instances by their id', function () {
      pkgInst.pkgs.should.include.key('b');
      pkgInst.pkgs.b.should.be.an.instanceOf(pkgDefB);
    });

    it( 'should be available recursively via each package id', function () {
      pkgInst.pkgs
        .should.be.an('object')
        .and.include.key('a');
      pkgInst.pkgs.a
        .should.include.key('pkgs')
        .and.be.an('object');
      pkgInst.pkgs.a.pkgs.should.equal(pkgInst.pkgs);
    });

  });

});