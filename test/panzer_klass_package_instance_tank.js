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
    var begin;

    pkgInst.tank.targetIndex.should.equal(-1);

    pkgDef.on('begin', begin = sinon.spy(function () {
      this.tank.targetIndex.should.not.equal(-1);
    }));
    tank.go(1);
    begin.should.have.been.called;
  });

  describe( '.go()', function () {

    it( 'should trigger package events', function () {
      var end = sinon.spy();

      pkgDef.on('end', end);

      pkgInst.tank.go(1);
      end.should.have.been.calledOnce;

      pkgInst.tank.go();
      end.should.have.been.calledTwice;
    });

    it( 'should return the number of traverse/traversing events', function () {
      var
        flag = 0,
        hdlr = sinon.spy(function () {
          if (flag) {
            this.tank.stop();
          }
        })
      ;

      pkgDef.on('traverse', hdlr);
      pkgDef.on('traversing', hdlr);

      tank.go(1);
      tank.go(1);
      hdlr.callCount.should.have.equal(3);

      tank.go().should.equal(0);
    });

    describe( 'while navigating', function () {

      it( 'should return true', function () {
        var begin;
        pkgDef.on('begin', begin = sinon.spy(function () {
          this.tank.go().should.be.true;
          this.tank.go(1).should.be.true;
          this.tank.go(-1).should.be.true;
        }));
        tank.go(1);
        begin.should.have.been.called;
      });

      it( 'should redirect the tank', function () {
        pkgDef.on('begin', function () {
          this.tank.go(4);
        });
        tank.go(1);
        tank.currentIndex.should.equal(4);
      });

    });

    describe( 'while interrupted', function () {

      it( 'should resume without a target', function () {
        var
          traverse = sinon.spy(function () {
            this.tank.stop();
          }),
          traversing = sinon.spy(),
          traversed = sinon.spy()
        ;
        pkgDef.on('traverse', traverse);
        pkgDef.on('traversing', traversing);
        pkgDef.on('traversed', traversed);

        tank.go(0);
        tank.go();

        traverse.should.have.been.calledOnce;
        traversing.should.have.been.calledOnce;
        traversed.should.have.been.calledOnce;
      });

    });

  });

  describe( '.stop()', function () {

    it( 'should return true when navigating, otherwise false', function () {
      var begin;

      tank.stop().should.be.false;
      pkgDef.on('begin', begin = sinon.spy(function () {
        this.tank.stop().should.be.true;
      }));
      tank.go();
      begin.should.have.been.called;
    });

    it( 'should stop navigation', function () {
      var
        traverse = sinon.spy(),
        engage
      ;

      pkgDef.on('traverse', traverse);
      pkgDef.on('engage', engage = sinon.spy(function () {
        this.tank.stop();
      }));

      tank.go(1);

      engage.should.have.been.called;
      traverse.should.not.have.been.called;
    });

    describe( 'for multiple packages', function () {

      var eventNames = [
        'onBegin','onEnd','onEngage','onNode',
        'onRelease','onScope','onTraverse',
        'onTraversed','onTraversing'
      ];

      it( 'should be honored by other packages', function () {
        var
          beginA,
          scopeA,
          beginB
        ;
        pkgDef.on('begin', beginA = sinon.spy(function () {
          this.tank.stop();
        }));
        pkgDef.on('scope', scopeA = sinon.spy());
        pkgDefB.on('begin', beginB = sinon.spy(function () {
          // need way to see we're stopping
          this.tank.go();
        }));

        pkgInst.tank.go(1);

        beginA.should.have.been.calledOnce;
        scopeA.should.not.have.been.called;
        beginB.should.have.been.calledOnce;

        pkgInstB.tank.currentIndex.should.equal(0);
      });

      it( 'should only be reversable by the same package', function () {
        var
          beginA,
          beginA2,
          beginB,
          tank = pkgInst.tank
        ;

        pkgDef.on('begin', beginA = sinon.spy(function () {
          this.tank.stop();
        }));

        pkgDefB.on('begin', beginB = sinon.spy(function () {
          this.tank.go();
        }));

        // note we're not stopped
        tank.targetIndex.should.equal(-1);

        tank.go(1);

        // note we're now stopped
        tank.targetIndex.should.not.equal(-1);
        beginA.should.have.been.calledOnce;
        beginB.should.have.been.calledOnce;
        beginA.should.have.been.calledBefore(beginB);

        beginA.reset();
        beginB.reset();

        // add unlocking by the same package
        pkgDef.on('begin', beginA2 = sinon.spy(function () {
          this.tank.go();
        }));

        tank.go();

        // note we're not stopped
        tank.targetIndex.should.equal(-1);
        beginA.should.have.been.calledOnce;
        beginA2.should.have.been.calledOnce;
        beginB.should.have.been.calledOnce;
        beginA.should.have.been.calledBefore(beginB);
        beginA2.should.have.been.calledBefore(beginB);
      });

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
        var
          postbackSpy = sinon.spy(),
          end = sinon.spy()
        ;
        pkgDef.on('begin', function () {
          this.tank.post(postbackSpy);
        });
        pkgDef.on('end', end);
        tank.go();
        postbackSpy.should.have.been.called;
        end.should.have.been.calledBefore(postbackSpy);

        postbackSpy.reset();
        pkgDef
          .off('begin')
          .off('end')
        ;
        tank.go();
        postbackSpy.should.not.have.been.called;
      });

      it( 'should return a numeric id for cancelling the postback', function () {
        var
          spy = sinon.spy(),
          postId
        ;
        pkgDef
          .on('begin', function () {
            postId = this.tank.post(spy);
          })
          .on('end', function () {
            this.tank.post(postId);
          })
        ;
        tank.go();

        postId.should.be.a('number');
        spy.should.not.have.been.called;
      });

      it( 'should return false when passed an invalid id or function', function () {
        pkgDef.on('begin', function () {
          var that = this;
          [-1, 100, '', 'foo', [], {}, true, false].forEach(function (arg) {
            that.tank.post(arg).should.be.false;
          });
        });
        tank.go();
      });

    });

  });

});