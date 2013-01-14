describe( 'Package initialization', function () {

  var
    Klass,
    pkgDef,
    pkgDefB
  ;

  beforeEach(function () {
    Klass = Panzer.create();
    pkgDef = Klass.pkg('a');
    pkgDefB = Klass.pkg('b');
  });

  it( 'should occur in the order packages were defined', function () {
    pkgDef.init = sinon.spy();
    pkgDefB.init = sinon.spy();
    new Klass();
    pkgDef.init.should.have.been.calledBefore(pkgDefB.init);
  });

  it( 'should allow directing the tank', function () {
    var pkgInst;
    pkgDef.init = function () {
      this.tank.go(1);
    };
    pkgInst = pkgDef(new Klass());
    pkgInst.tank.currentIndex.should.equal(1);
  });

  it( 'should allow directing the tank', function () {
    var pkgInst;
    pkgDef.init = function () {
      this.tank.go(1);
    };
    pkgDef.onBegin = sinon.spy();
    pkgInst = pkgDef(new Klass());
    pkgInst.tank.currentIndex.should.equal(1);
    pkgDef.onBegin.should.not.have.been.called;
  });

  it( 'should not reference the proxy (Klass instance)', function () {
    pkgDef.init = function () {
      this.should.not.include.key('proxy');
    };
    pkgDef(new Klass()).should.include.key('proxy');
  });

  it( 'should have a .pkgs member', function () {
    pkgDef.init = sinon.spy(function () {
      this.should.include.key('pkgs');
      this.pkgs.should.include.key('b');
    });
    new Klass();
    pkgDef.init.should.have.been.called;
  });


});