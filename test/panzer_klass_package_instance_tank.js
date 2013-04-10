describe( 'Package Tank', function () {

  var
    Klass,
    proxy,
    pkgDef,
    pkgDefB,
    pkgInst,
    pkgInstB,
    tank,
    tankB,
    stuffObj = [],
    stuff = {'a':1,'a2':'foo', 'c': stuffObj}
  ;

  beforeEach(function () {
    Klass = Panzer.create();
    pkgDef = Klass.pkg('a');
    pkgDefB = Klass.pkg('b');
    proxy = new Klass(stuff);
    pkgInst = pkgDef(proxy);
    tank = pkgInst.tank;
    pkgInstB = pkgDefB(proxy);
    tankB = pkgInstB.tank;
  });

  it( 'should be an object shared by package-instances', function () {
    pkgInst.tank.should.equal(pkgInstB.tank);
  });

  it( 'should reflect a numeric Klass instance identifier', function () {
    tank.id
      .should.be.a('number')
      .and.be.ok;
  });

  it( 'should reflect the current node index', function () {
    pkgInst.tank.currentIndex.should.equal(0);
    pkgInst.tank.go(1);
    pkgInst.tank.currentIndex.should.equal(1);
    pkgInstB.tank.currentIndex.should.equal(1);
  });

  it( 'should reflect the target node index or -1', function () {
    pkgInst.tank.targetIndex.should.equal(-1);

    pkgDef.onBegin = sinon.spy(function () {
      this.tank.targetIndex.should.not.equal(-1);
    });
    tank.go(1);
    pkgDef.onBegin.should.have.been.called;
  });

  describe( '.go()', function () {

    it( 'should trigger package events', function () {
      pkgDef.onEnd = sinon.spy();
      pkgInst.tank.go(1);
      pkgDef.onEnd.should.have.been.calledOnce;
      pkgInst.tank.go();
      pkgDef.onEnd.should.have.been.calledTwice;
    });

    it( 'should return the number of traverse/traversing events', function () {
      var flag = 0;
      pkgDef.onTraverse = pkgDef.onTraversing = sinon.spy(function () {
        if (flag) {
          this.tank.stop();
        }
      });
      tank.go(1);
      tank.go(1);
      pkgDef.onTraverse.callCount.should.have.equal(3);

      tank.go().should.equal(0);
    });

    describe( 'while navigating', function () {

      it( 'should return true', function () {
        pkgDef.onBegin = sinon.spy(function () {
          this.tank.go().should.be.true;
          this.tank.go(1).should.be.true;
          this.tank.go(-1).should.be.true;
        });
        tank.go(1);
        pkgDef.onBegin.should.have.been.called;
      });

      it( 'should redirect the tank', function () {
        pkgDef.onBegin = function () {
          this.tank.go(4);
        };
        tank.go(1);
        tank.currentIndex.should.equal(4);
      });

    });

    describe( 'while interrupted', function () {

      it( 'should resume without a target', function () {
        pkgDef.onTraverse = sinon.spy(function () {
          this.tank.stop();
        });
        pkgDef.onTraversing = sinon.spy();
        pkgDef.onTraversed = sinon.spy();
        tank.go(0);
        tank.go();
        pkgDef.onTraverse.should.have.been.calledOnce;
        pkgDef.onTraversing.should.have.been.calledOnce;
        pkgDef.onTraversed.should.have.been.calledOnce;
      });

    });

  });

  describe( '.stop()', function () {

    it( 'should return true when navigating, otherwise false', function () {
      tank.stop().should.be.false;
      pkgDef.onBegin = sinon.spy(function () {
        this.tank.stop().should.be.true;
      });
      tank.go();
      pkgDef.onBegin.should.have.been.called;
    });

    it( 'should stop navigation', function () {
      pkgDef.onTraverse = sinon.spy();

      pkgDef.onEngage = sinon.spy(function () {
        this.tank.stop();
      });
      tank.go(1);
      pkgDef.onEngage.should.have.been.called;
      pkgDef.onTraverse.should.not.have.been.called;
    });

  });

  describe( '.post()', function () {

    it( 'should return false', function () {
      tank.post().should.be.false;
      tank.post(function () {}).should.be.false;
      tank.post(1).should.be.false;
    });

    describe( 'while navigating', function () {

      it( 'should invoke a functon (postback) once, when navigation ends', function () {
        var postbackSpy = sinon.spy();
        pkgDef.onBegin = function () {
          this.tank.post(postbackSpy);
        };
        pkgDef.onEnd = sinon.spy();
        tank.go();
        postbackSpy.should.have.been.called;
        pkgDef.onEnd.should.have.been.calledBefore(postbackSpy);

        postbackSpy.reset();
        pkgDef.onBegin = pkgDef.onEnd = 0;
        tank.go();
        postbackSpy.should.not.have.been.called;
      });

      it( 'should return a numeric id for cancelling the postback', function () {
        var
          spy = sinon.spy(),
          postId
        ;
        pkgDef.onBegin = function () {
          postId = this.tank.post(spy);
        };
        pkgDef.onEnd = function () {
          this.tank.post(postId);
        };
        tank.go();

        postId.should.be.a('number');
        spy.should.not.have.been.called;
      });

      it( 'should return false when passed an invalid id or function', function () {
        pkgDef.onBegin = function () {
          var that = this;
          [-1, 100, '', 'foo', [], {}, true, false].forEach(function (arg) {
            that.tank.post(arg).should.be.false;
          });
        };
        tank.go();
      });

    });

  });

});