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

  it( 'should move the tank without firing events', function () {
    var pkgInst;
    pkgDef.init = function () {
      this.tank.go(1);
    };
    pkgDef.onBegin = sinon.spy();
    pkgDef.onEnd = sinon.spy();
    pkgInst = pkgDef(new Klass());
    pkgInst.tank.currentIndex.should.equal(1);
    pkgDef.onBegin.should.not.have.been.called;
    pkgDef.onEnd.should.not.have.been.called;
    pkgInst.tank.go(0);
    pkgDef.onBegin.should.have.been.calledOnce;
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