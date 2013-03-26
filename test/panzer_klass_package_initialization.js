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

  it( 'should reference the public proxy (the Klass instance)', function () {
    var initProxy, publicProxy;
    pkgDef.init = function () {
      this.should.include.key('proxy');
      initProxy = this.proxy;
    };
    publicProxy = new Klass();
    pkgDef(publicProxy).should.include.key('proxy');
    publicProxy.should.equal(initProxy);

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