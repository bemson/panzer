describe( 'Package Instance', function () {

  var
    Klass,
    proxy,
    pkgDef,
    pkgInst
  ;

  beforeEach(function () {
    Klass = Panzer.create();
    pkgDef = Klass.pkg('a');
    proxy = new Klass();
    pkgInst = pkgDef(proxy);
  });

  describe( '.proxy', function () {

    it( 'should be an object property', function () {
      expect(pkgInst.proxy).to.be.an('object');
    });

    it( 'should reference the public instance', function () {
      pkgInst.proxy.should.equal(proxy);
    });

    it( 'should be shared between package-instances', function () {
      var
        pkgDefB = Klass.pkg('foo'),
        sharedProxy = new Klass()
      ;

      pkgDef(sharedProxy).proxy.should.equal(sharedProxy);
      pkgDefB(sharedProxy).proxy.should.equal(sharedProxy);
    });

  });

  describe( '.pkgs', function () {

    it( 'should be an object property', function () {
      expect(pkgInst.pkgs).to.be.an('object');
    });

    it( 'should be shared between package-instances', function () {
      var
        pkgDefB = Klass.pkg('foo'),
        proxy = new Klass()
      ;

      pkgDefB(proxy).pkgs.should.equal(pkgDef(proxy).pkgs);
    });

    it( 'should reference all package-instances of a proxy', function () {
      var
        pkgFoo = Klass.pkg('foo'),
        pkgBar = Klass.pkg('bar'),
        proxy = new Klass(),
        fooInst = pkgFoo(proxy),
        barInst = pkgBar(proxy)
      ;

      fooInst.pkgs.should.include.keys('foo', 'bar');
      fooInst.pkgs.foo.should.equal(fooInst);
      fooInst.pkgs.bar.should.equal(barInst);
    });

  });

  describe( '.tank', function () {

    it( 'should be an object property', function () {
      expect(pkgInst.tank).to.be.an('object');
    });

    it( 'should be shared between package-instances', function () {
      var
        pkgDefB = Klass.pkg('foo'),
        proxy = new Klass()
      ;

      expect(pkgDef(proxy).tank).to.equal(pkgDefB(proxy).tank);
    });

  });

  describe( '.nodes', function () {

    it( 'should be an array property', function () {
      expect(pkgInst.nodes).to.be.an('array');
    });

    it( 'should have at least two nodes, regardless of the source value', function () {
      pkgInst.nodes.length.should.be.above(1);
      pkgDef(new Klass()).nodes.length.should.equal(2);
    });

    describe( 'across packages', function () {

      var pkgDefB, pkgInstB;

      beforeEach(function () {
        pkgDefB = Klass.pkg('foo');
        proxy = new Klass({a:1,b:2});
        pkgInst = pkgDef(proxy);
        pkgInstB = pkgDefB(proxy);
      });

      it( 'should have the same members of nodes at the same index', function () {
        pkgInst.nodes.should.deep.equal(pkgInstB.nodes);
      });

    });

    describe( 'with delayed parsing', function () {

      it( 'should be empty');

      it( 'should not be empty, at "init" event');

      it( 'should not be empty, when `.ready` promise resolves');

    });

    describe( 'with delayed initialization', function () {

      it( 'should be empty');

      it( 'should not be empty, at "init" event');

      it( 'should not be empty, when `.ready` promise resolves');

    });

  });

  describe( '#toString()', function () {

    it( 'should be a non-inherited method', function () {
      pkgInst.should.have.ownProperty('toString');
      pkgInst.should.itself.respondTo('toString');
    });

    it( 'should behave like `Object#toString()`', function () {
      pkgInst.toString().should.equal(({}).toString());
      pkgInst.toString(12).should.equal(({}).toString(12));
    });

    it( 'should reference the proxy method, of the same name', function () {
      pkgInst.toString.should.equal(proxy.toString);
    });

  });

});