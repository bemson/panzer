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
    var
      pkgInst,
      begin = sinon.spy(),
      end = sinon.spy()
    ;
    pkgDef.init = function () {
      this.tank.go(1);
    };
    pkgDef.on('begin', begin);
    pkgDef.on('end', end);
    pkgInst = pkgDef(new Klass());
    pkgInst.tank.currentIndex.should.equal(1);

    begin.should.not.have.been.called;
    end.should.not.have.been.called;

    pkgInst.tank.go(0);
    begin.should.have.been.calledOnce;
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