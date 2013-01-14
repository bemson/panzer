describe( 'Package nodes', function () {

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

  it( 'should have at least two nodes', function () {
    pkgDef(new Klass()).nodes.should.have.length(2);
    pkgInst.nodes.should.have.length.above(2);
  });

  it( 'should contain different nodes with the same content per package-instance', function () {
    pkgInst.nodes.should.deep.equal(pkgInstB.nodes);
  });

  it( 'should not have internal tank keys', function () {
    pkgInst.nodes[0].should.not.include.keys('ctx', 'lte');
  });

  describe( 'instance', function () {

    it( 'should have numeric positional properties', function () {
      var positionProperties = [
        'index',
        'depth',
        'parentIndex',
        'previousIndex',
        'nextIndex',
        'firstChildIndex',
        'lastChildIndex',
        'childIndex'
      ];
      pkgInst.nodes[0].should.include.keys(positionProperties);
      positionProperties.forEach(function (prop) {
        pkgInst.nodes[0][prop].should.be.a('number');
      });
    });

    it( 'should set unapplicable position properties to -1', function () {
      pkgInst.nodes[0].previousIndex.should.equal(-1);
      pkgInst.nodes[1].nextIndex.should.equal(-1);
    });

    it( 'should have node-attributes in the attrs property', function () {
      pkgInst.nodes[1].attrs.should.be.empty;

      pkgDef.attrKey = /\d/;
      pkgInst = pkgDef(new Klass(stuff));
      pkgInst.nodes[1].attrs.should.have.key('a2');
    });

    it( 'should have methods from the packages\'s .node prototype', function () {
      pkgDef.node.isPrototypeOf(pkgInst.nodes[0]).should.be.ok;
      pkgDefB.node.isPrototypeOf(pkgInstB.nodes[0]).should.be.ok;
    });

  });

  describe( 'first node', function () {

    it( 'should have an undefined .value', function () {
      expect(pkgInst.nodes[0].value).to.be.a('undefined');
    });

    it( 'should have .name be "PNULL"', function () {
      pkgInst.nodes[0].name.should.equal('PNULL');
    });

    it( 'should have .path be "..//"', function () {
      pkgInst.nodes[0].path.should.equal('..//');
    });

  });

  describe( 'second node', function () {

    it( 'should have the raw tree as it\'s .value', function () {
      expect(pkgInst.nodes[1].value).to.equal(stuff);
    });

    it( 'should have .name be "PROOT"', function () {
      pkgInst.nodes[1].name.should.equal('PROOT');
    });

    it( 'should have .path be "//"', function () {
      pkgInst.nodes[1].path.should.equal('//');
    });

  });

});
