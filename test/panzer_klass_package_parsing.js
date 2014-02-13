describe( 'Package parsing', function () {

  var
    Klass,
    pkgDef,
    stuffObj = [],
    stuff = {'a':1,'a2':'foo', 'c': stuffObj}
  ;

  beforeEach(function () {
    Klass = Panzer.create();
    pkgDef = Klass.pkg('a');
  });

  it( 'should scope functions to the execution scope', function () {
    pkgDef.attrKey = sinon.spy();
    pkgDef.badKey = sinon.spy();
    pkgDef.prepNode = sinon.spy();
    pkgDef.prepTree = sinon.spy();

    new Klass(stuff);

    if (typeof exports === 'undefined') {
      // browser
      pkgDef.attrKey.should.have.always.been.calledOn(window);
      pkgDef.badKey.should.have.always.been.calledOn(window);
      pkgDef.prepNode.should.have.always.been.calledOn(window);
      pkgDef.prepTree.should.have.always.been.calledOn(window);
    } else {
      // nodejs
      pkgDef.attrKey.firstCall.thisValue.should.be.empty;
      pkgDef.badKey.firstCall.thisValue.should.be.empty;
      pkgDef.prepNode.firstCall.thisValue.should.be.empty;
      pkgDef.prepTree.firstCall.thisValue.should.be.empty;
    }
  });

  describe( '.attrKey', function () {

    describe( 'when a regular expression', function () {

      it( 'should compile members with matching keys as node attributes', function () {
        var nodes;

        pkgDef.attrKey = /./;
        nodes = pkgDef(new Klass(stuff)).nodes;
        nodes.should.length(2);
        nodes[1].attrs.should.have.keys('a', 'a2', 'c');
      });

    });

    describe( 'when a function', function () {

      it( 'should receive each member\'s key and value', function () {
        pkgDef.attrKey = sinon.spy();

        pkgDef(new Klass(stuff));

        pkgDef.attrKey.should.have.been.calledThrice;
        pkgDef.attrKey.firstCall.should.have.been.calledWith('a', 1);
        pkgDef.attrKey.secondCall.should.have.been.calledWith('a2', 'foo');
        pkgDef.attrKey.thirdCall.should.have.been.calledWith('c', stuffObj);
      });

      it( 'should compiling members as node attributes when returning a truthy value', function () {

        var nodes;

        pkgDef.attrKey = function (name, value) {return 1};
        nodes = pkgDef(new Klass(stuff)).nodes;
        nodes.should.length(2);
        nodes[1].attrs.should.have.keys('a', 'a2', 'c');
      });

    });
  });

  describe( '.badKey', function () {

    describe( 'when a regular expression', function () {

      it( 'should deny compiling members with matching keys to nodes', function () {
        pkgDef.badKey = /\d/;
        pkgDef(new Klass(stuff)).nodes
          .filter(function (node) {
            return pkgDef.badKey.test(node.name);
          }).should.be.empty;
      });

    });

    describe( 'when a function', function () {

      it( 'should receive each member\'s key and value', function () {

        var spy = sinon.spy();

        pkgDef.badKey = spy;

        pkgDef(new Klass(stuff));

        spy.should.have.been.calledThrice;
        spy.firstCall.should.have.been.calledWith('a', 1);
        spy.secondCall.should.have.been.calledWith('a2', 'foo');
        spy.thirdCall.should.have.been.calledWith('c', stuffObj);
      });

      it( 'should deny compiling members to nodes when returning a truthy value', function () {

        var spy = sinon.spy(function (name, value) {
          return 1;
        });

        pkgDef.badKey = spy;

        pkgDef(new Klass(stuff)).nodes.should.have.length(2);
      });

    });
  });

  describe( '.prepNode', function () {

    it( 'should receive each found member and the raw tree', function () {
      pkgDef.prepNode = sinon.spy();
      new Klass(stuff);

      pkgDef.prepNode.should.have.been.calledWith(stuff, stuff);
      pkgDef.prepNode.should.have.been.calledWith(stuff.a, stuff);

      pkgDef.prepNode.firstCall.args[0].should.equal(stuff);
      pkgDef.prepNode.secondCall.args[0].should.equal(stuff.a);
      pkgDef.prepNode.thirdCall.args[0].should.equal(stuff.a2);
    });

    it( 'should alter the compiled tree by returning an object', function () {
      var
        nodeCount = pkgDef(new Klass(stuff)).nodes.length,
        changed = 0
      ;

      pkgDef.prepNode = function () {
        if (!changed) {
          changed = 1;
          return {a:1};
        }
      };
      pkgDef(new Klass(stuff)).nodes.length
        .should.be.below(nodeCount)
        .and.equal(3);
    });

    it( 'should allow changing the raw tree', function () {
      var nodeCount = pkgDef(new Klass(stuff)).nodes.length;

      pkgDef.prepNode = function () {
        return 1;
      };
      pkgDef(new Klass(stuff)).nodes.length.should
        .be.below(nodeCount)
        .and.equal(2);
    });

  });

  describe( '.prepTree', function () {

    it( 'should receive the raw tree', function () {
      pkgDef.prepTree = sinon.spy();
      new Klass(stuff);
      pkgDef.prepTree.should.have.been.calledWith(stuff);
    });

    it( 'should be called once per Klass instantiation', function () {
      pkgDef.prepTree = sinon.spy();
      new Klass();
      pkgDef.prepTree.should.have.been.calledOnce;
    });

    it( 'should be called before .prepNode', function () {
      pkgDef.prepTree = sinon.spy();
      pkgDef.prepNode = sinon.spy();
      new Klass({foo:'bar'});
      pkgDef.prepTree.should.have.been.calledBefore(pkgDef.prepNode);
      pkgDef.prepNode.should.have.been.called;
    });

    it( 'should alter the compiled tree by returning any defined value', function () {
      var
        nodeCount = pkgDef(new Klass(stuff)).nodes.length,
        changed = 0
      ;

      pkgDef.prepTree = function () {};
      pkgDef(new Klass(stuff)).nodes.length.should.equal(nodeCount);

      pkgDef.prepTree = function () {
        return undefined;
      };
      pkgDef(new Klass(stuff)).nodes.length.should.equal(nodeCount);

      pkgDef.prepTree = function () {
        return 0;
      };
      pkgDef(new Klass(stuff)).nodes.length.should.be.below(nodeCount);

      pkgDef.prepTree = function () {
        return {more:stuff};
      };
      pkgDef(new Klass(stuff)).nodes.length.should.be.above(nodeCount);
    });

  });

});