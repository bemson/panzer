describe( 'Package chains', function () {

  var
    Klass,
    pkgDef
  ;

  before(function () {
    Klass = Panzer.create();
    pkgDef = Klass.pkg('a');
  });

  describe( '.prototype', function () {

    it( 'should be the prototype of the package-instance', function () {
      var pkgB = Klass.pkg('b');
      pkgDef.prototype.should.satisfy(function (pkgProto) {
        return pkgProto.isPrototypeOf(pkgDef(new Klass()));
      });
      pkgB.prototype.should.satisfy(function (pkgProto) {
        return pkgProto.isPrototypeOf(pkgB(new Klass()));
      });
    });

  });

  describe( '.node', function () {

    it( 'should be the prototype of package-instance nodes', function () {
      var pkgB = Klass.pkg('b');
      pkgDef.node.should.satisfy(function (nodeProto) {
        return nodeProto.isPrototypeOf(pkgDef(new Klass()).nodes[0]);
      });
      pkgB.node.should.satisfy(function (nodeProtoB) {
        return nodeProtoB.isPrototypeOf(pkgB(new Klass()).nodes[0]);
      });
      pkgB.node.should.not.satisfy(function (nodeProtoB) {
        return nodeProtoB.isPrototypeOf(pkgDef(new Klass()).nodes[0]);
      });
    });

  });

  describe( '.proxy', function () {

    it( 'should be the prototype of Klass instances', function () {
      var pkgB = Klass.pkg('b');
      pkgDef.proxy.should.satisfy(function (proxyProto) {
        return proxyProto.isPrototypeOf(new Klass());
      });
      pkgB.proxy.should.satisfy(function (proxyProtoB) {
        return proxyProtoB.isPrototypeOf(new Klass());
      });
    });

  });

});