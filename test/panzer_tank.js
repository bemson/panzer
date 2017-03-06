describe( 'Tank', function () {

  var source, Klass, pkgDef, proxy, pkgInst, tank, invalidIndice;

  beforeEach(function () {
    invalidIndice = [-1, 1.5, 0.2, [], {}, '', 'abc', undefined, null, NaN, /a/];
    source = {a:{b:1,c:4},d:{f:1,g:{h:3,k:9}}};
    Klass = Panzer.create();
    pkgDef = Klass.pkg('a');
    proxy = new Klass(source);
    pkgInst = pkgDef(proxy);
    tank = pkgInst.tank;
  });

  it( 'should be an object', function () {
    var proxy = new Klass();

    expect(pkgDef(proxy).tank).to.be.an('object');
  });

  it( 'should be a shared member of all corresponding package-instances', function () {
    var
      pkgDefB = Klass.pkg('foo'),
      proxy = new Klass()
    ;

    expect(pkgDefB(proxy).tank).to.exist;

    pkgDefB(proxy).tank.should.equal(pkgDef(proxy).tank);
  });

  describe( '.id', function () {

    it( 'should be a string, formatted as "a_b_c"', function () {
      expect(tank.id).to.be.a('string');
      tank.id.should.match(/^\d+_\d+_\d+$/);
    });

    it( 'should begin with the Panzer class id', function () {
      tank.id.indexOf(Klass.id).should.equal(0);
    });

    it( 'should be unique across all instances', function () {
      (new Array(10))
        .map(function () {
          var
            Klass = Panzer.create(),
            pkgDef = Klass.pkg('a'),
            id = pkgDef(new Klass()).tank.id
          ;

          expect(id).to.be.a('string');

          return id;
        })
        .filter(function (id, idx, ary) {
          // only capture non-unique ones
          return ary.indexOf(id) !== idx;
        })
        .should.have.lengthOf(0, 'found duplicate ids');
    });

  });

  describe( '.cc', function () {

    it( 'should be a number', function () {
      expect(tank.cc).to.be.a('number');
    });

    it( 'should start at 0', function () {
      tank.cc.should.equal(0);
    });

    describe( 'after calling `#go()`', function () {

      it( 'should increment', function () {
        var lastValue = tank.cc;

        tank.go(1);
        tank.cc.should.equal(lastValue + 1);
      });

      describe( 'without arguments', function () {

        it( 'should increment', function () {
          var lastValue = tank.cc;

          tank.go();
          tank.cc.should.equal(lastValue + 1);
        });

      });

      describe( 'when navigation is stopped', function () {

        it( 'should increment', function () {
          var lastValue = tank.cc;

          pkgDef.on('begin', function () {
            tank.stop();
          });

          tank.go(1);
          tank.stopped.should.be.true;

          tank.target.should.not.equal(-1, 'navigation was not stopped');
          tank.cc.should.equal(lastValue + 1);
        });

      });

      describe( 'when navigation is blocked', function () {

        beforeEach(function () {
          pkgDef.on('begin', function () {
            pkgDef.off();
            return Promise.resolve();
          });
        });

        it( 'should increment', function () {
          var lastValue = tank.cc;

          tank.go(1);
          tank.blocked.should.be.true;
          tank.cc.should.equal(lastValue + 1);
        });

        it( 'should not increment when resuming', function () {
          var
            lastValue = tank.cc,
            promise
          ;

          promise = tank.go(1);
          tank.blocked.should.be.true;
          tank.cc.should.equal(lastValue + 1);

          lastValue = tank.cc;

          return promise.then(function () {
            tank.cc.should.equal(lastValue, 'call count changed upon resumption');
          });
        });

        it( 'should increment each time `#go()` is called before resuming', function () {
          var lastValue = tank.cc;

          tank.go(1);
          tank.blocked.should.be.true;

          tank.cc.should.equal(lastValue + 1);
          lastValue = tank.cc;

          tank.go(2);
          tank.cc.should.equal(lastValue + 1);
          lastValue = tank.cc;

          tank.go();
          tank.cc.should.equal(lastValue + 1);
          lastValue = tank.cc;
        });

      });

    });

    describe( 'after calling `#queue()`', function () {

      var tankA, tankB;

      beforeEach(function () {
        tankA = tank;
        tankB = pkgDef(new Klass()).tank;
      });

      describe( 'without a target index', function () {

        it( 'should increment', function () {
          var lastValue = tank.cc;

          tankA.queue(tankB);
          tankA.cc.should.equal(lastValue + 1);
        });

      });

      describe( 'when navigation is stopped', function () {

        it( 'should increment', function () {
          var lastValue;

          pkgDef.on('begin', function () {
            tankA.stop();
          });

          tankA.go(1);
          tankA.stopped.should.be.true;

          lastValue = tankA.cc;

          tankA.queue(tankB);

          tankA.cc.should.equal(lastValue + 1);
        });

      });

      describe( 'when navigation is blocked', function () {

        it( 'should increment', function () {
          var lastValue;

          pkgDef.on('begin', function () {
            pkgDef.off();
            return Promise.resolve();
          });

          tankA.go(1);
          tankA.blocked.should.be.true;

          lastValue = tank.cc;

          tankA.queue(tankB);
          tankA.cc.should.equal(lastValue + 1);
        });

        it( 'should not increment when resuming', function () {
          var lastValue, promise;

          pkgDef.on('begin', function () {
            pkgDef.off();
            return Promise.resolve();
          });

          tankA.go(1);
          tankA.blocked.should.be.true;

          lastValue = tankA.cc;

          promise = tankA.queue(tankB);
          tankA.cc.should.equal(lastValue + 1);

          lastValue = tankA.cc;

          tankB.go();

          return promise.then(function () {
            tankA.cc.should.equal(lastValue, 'call count changed upon resumption');
          });
        });

        it( 'should increment each time `#queue()` is called before resuming', function () {
          var lastValue;

          pkgDef.on('begin', function () {
            pkgDef.off();
            return Promise.resolve();
          });

          tankA.go(1);
          tankA.blocked.should.be.true;
          lastValue = tankA.cc;

          tankA.queue(tankB);
          tankA.cc.should.equal(lastValue + 1);
          lastValue = tankA.cc;

          tankA.queue(tankB, 1);
          tankA.cc.should.equal(lastValue + 1);
          lastValue = tankA.cc;

          tankA.queue(tankB, 2);
          tankA.cc.should.equal(lastValue + 1);
          lastValue = tankA.cc;
        });

      });

    });

  });

  describe( '.index', function () {

    it( 'should be a number', function () {
      expect(tank.index).to.be.a('number');
    });

    it( 'should reflect the current node index', function () {
      tank.index.should.equal(0);
      tank.go(1);
      tank.index.should.equal(1);
      tank.go(2);
      tank.index.should.equal(2);
    });

    it( 'should start at 0', function () {
      tank.index.should.equal(0);
    });

  });

  describe( '.target', function () {

    it('should be a number', function () {
      expect(tank.target).to.be.a('number');
    });

    describe( 'default value', function () {

      it( 'should be -1', function () {
        tank.target.should.equal(-1);
      });

    });

    describe( 'after completing navigation', function () {

      it( 'should be -1', function () {
        var spy = sinon.spy(function () {
          tank.target.should.not.equal(-1);
        });

        pkgDef.on('begin', spy);

        tank.go(1);

        tank.target.should.equal(-1);

        spy.should.have.been.called;
      });

    });

    describe( 'when navigation is stopped', function () {

      it( 'should reflect the destination node index', function () {
        var
          targetIndex = 2,
          spy = sinon.spy(function() {
            tank.stop();
          })
        ;

        pkgDef.on('begin', spy);

        tank.go(targetIndex);

        tank.target.should.equal(targetIndex);
        spy.should.have.been.called;
      });

    });

    describe( 'when navigation is blocked', function () {

      it( 'should reflect the destination node index', function () {
        var
          targetIndex = 2,
          spy = sinon.spy(function() {
            pkgDef.off();
            return Promise.resolve();
          })
        ;

        pkgDef.on('begin', spy);

        tank.go(targetIndex);

        tank.target.should.equal(targetIndex);
        spy.should.have.been.called;
      });

    });

    describe( 'within the loop', function () {

      it( 'should reflect the destination node index', function () {
        var
          targetIndex = 1,
          loopEvents = ['begin', 'move', 'engage', 'switch', 'scope', 'traverse'],
          spy = sinon.spy(function () {
            tank.target.should.equal(targetIndex);
          })
        ;
        pkgDef.on(loopEvents, spy);
        tank.go(1);
        spy.callCount.should.equal(loopEvents.length + 1);
      });

      describe( 'on "release", "idle", and "end" of the destination node', function () {

        it( 'should be -1', function () {
          var exitSpy = sinon.spy(function () {
            tank.target.should.equal(-1);
          });

          pkgDef.on(['release', 'idle', 'end'], exitSpy);
          tank.go(1);

          exitSpy.should.have.been.calledThrice;
        });

      });

    });

  });

  describe( '.active', function () {

    it( 'should be a boolean', function () {
      expect(tank.active).to.be.a('boolean');
    });

    it( 'should be false outside event handlers', function () {
      tank.active.should.be.false;
    });

    it( 'should be true inside event handlers', function () {
      pkgDef.on(
        ['begin', 'move', 'switch', 'engage', 'traverse', 'scope', 'release', 'idle', 'end'],
        function () {
          tank.active.should.be.true;
        }
      );
      tank.go(3);
    });

    it( 'should be `false` within `#go()` promised thenables', function () {
      return tank.go()
        .then(function () {
          tank.active.should.be.false;
        });
    });

  });

  describe( '#toString()', function () {

    it( 'should be a non-inherited method', function () {
      tank.should.have.ownProperty('toString');
      tank.should.itself.respondTo('toString');
    });

    it( 'should behave like `Object#toString()`', function () {
      tank.toString().should.equal(({}).toString());
      tank.toString(12).should.equal(({}).toString(12));
    });

    it( 'should reference the package-instance method, of the same name', function () {
      tank.toString.should.equal(pkgInst.toString);
    });

  });

  describe( '#go()', function () {

    it( 'should be a method', function () {
      expect(tank.go).to.be.a('function');
    });

    it( 'should expect one argument', function () {
      tank.go.should.have.lengthOf(1);
    });

    it( 'should return a promise', function () {
      expect(tank.go()).to.be.an.instanceOf(Promise);
    });

    describe( 'with a valid index', function () {

      it( 'should trigger loop & navigation events', function () {
        var
          switchSpy = sinon.spy(),
          releaseSpy = sinon.spy()
        ;

        pkgDef.on('switch', switchSpy);
        pkgDef.on('release', releaseSpy);

        pkgInst.tank.go(1);
        switchSpy.should.have.been.called;
        releaseSpy.should.have.been.called;
      });

      it( 'should change the tank index', function () {
        var targetIndex = 2;

        tank.go(targetIndex);
        tank.index.should.equal(targetIndex);
      });

      it( 'should resolve the promise when navigation completes', function () {
        var targetIndex = 2;

        return tank
          .go(targetIndex)
          .then(function () {
            tank.index.should.equal(targetIndex);
          });
      });

    });

    describe( 'with an invalid index or non-numeric value', function () {

      it( 'should throw', function () {
        invalidIndice.forEach(function (val) {
          expect(function () {
            tank.go(val);
          }).to.throw;
        });
      });

    });

    describe( 'without an index', function () {

      it( 'should resume an interrupted navigation', function () {
        var targetIndex = 3;

        pkgDef.on('begin', function () {
          pkgDef.off('begin');
          tank.stop();
        });

        tank.go(targetIndex);
        tank.index.should.not.equal(targetIndex);

        tank.go();
        tank.index.should.equal(targetIndex);
      });

      it( 'should trigger the "begin" and "end" events', function () {
        var
          beginSpy = sinon.spy(),
          endSpy = sinon.spy()
        ;

        pkgDef.on('begin', beginSpy);
        pkgDef.on('end', endSpy);

        tank.go();

        beginSpy.should.have.been.called;
        endSpy.should.have.been.called;
      });

    });

    describe( 'when navigation has been blocked', function () {

      it( 'should trigger the "intercept" event', function () {
        var spy = sinon.spy();

        pkgDef.on('begin', function () {
          pkgDef.off('begin');
          return Promise.resolve();
        });

        pkgDef.on('intercept', spy);

        tank.go(1);
        spy.should.not.have.been.called;

        tank.go();
        spy.should.have.been.called;
      });

      describe( 'after intercepting a motion event', function () {

        it( 'should trigger switch-resume event', function () {
          var
            motionSpy = sinon.spy(),
            interceptSpy = sinon.spy(function () {
              return true;
            })
          ;

          pkgDef.on('switch', function () {
            pkgDef.off('switch');
            return Promise.resolve();
          });
          pkgDef.on('intercept', interceptSpy);
          pkgDef.on('switch-resume', motionSpy);

          tank.go(1);

          tank.target.should.not.equal(-1);

          tank.go();

          tank.target.should.equal(-1);

          interceptSpy.should.have.been.called;
          motionSpy.should.have.been.called;
        });

        it( 'should trigger scope-resume event', function () {
          var
            motionSpy = sinon.spy(),
            interceptSpy = sinon.spy(function () {
              return true;
            })
          ;

          pkgDef.on('scope', function () {
            pkgDef.off('scope');
            return Promise.resolve();
          });
          pkgDef.on('intercept', interceptSpy);
          pkgDef.on('scope-resume', motionSpy);

          tank.go(1);

          tank.target.should.not.equal(-1);

          tank.go();

          tank.target.should.equal(-1);

          interceptSpy.should.have.been.called;
          motionSpy.should.have.been.called;
        });

        it( 'should trigger traverse-resume event', function () {
          var
            motionSpy = sinon.spy(),
            interceptSpy = sinon.spy(function () {
              return true;
            })
          ;

          pkgDef.on('traverse', function () {
            pkgDef.off('traverse');
            return Promise.resolve();
          });
          pkgDef.on('intercept', interceptSpy);
          pkgDef.on('traverse-resume', motionSpy);

          tank.go(1);

          tank.target.should.not.equal(-1);

          tank.go();

          tank.target.should.equal(-1);

          interceptSpy.should.have.been.called;
          motionSpy.should.have.been.called;
        });

      });

      describe( 'after intercepting a gate event', function () {

        it( 'should not resume any motion event', function () {
          var
            motionSpy = sinon.spy(),
            gateEvents = ['begin', 'move', 'engage']
          ;

          pkgDef.on(['switch-resume', 'scope-resume', 'traverse-resume'], motionSpy);
          pkgDef.on('intercept', function () {
            return true;
          });

          gateEvents.forEach(function (eventName) {
            tank.go(0);

            pkgDef.on(eventName, function tmp() {
              pkgDef.off(eventName, tmp);
              return Promise.resolve();
            });

            tank.go(2);

            tank.target.should.not.equal(-1);

            tank.go();

            tank.target.should.equal(-1);
          });

          motionSpy.should.not.have.been.called;
        });

      });

    });

    describe( 'when navigation has been stopped', function () {

      describe( 'on a motion event', function () {

          it( 'should trigger switch-resume event', function () {
            var
              motionSpy = sinon.spy(),
              interceptSpy = sinon.spy(function () {
                return true;
              })
            ;

            pkgDef.on('switch', function () {
              pkgDef.off('switch');
              tank.stop();
            });
            pkgDef.on('intercept', interceptSpy);
            pkgDef.on('switch-resume', motionSpy);

            tank.go(1);

            tank.target.should.not.equal(-1);

            tank.go();

            tank.target.should.equal(-1);

            interceptSpy.should.not.have.been.called;
            motionSpy.should.have.been.called;
          });

          it( 'should trigger traverse-resume event', function () {
            var
              motionSpy = sinon.spy(),
              interceptSpy = sinon.spy(function () {
                return true;
              })
            ;

            pkgDef.on('traverse', function () {
              pkgDef.off('traverse');
              tank.stop();
            });
            pkgDef.on('intercept', interceptSpy);
            pkgDef.on('traverse-resume', motionSpy);

            tank.go(1);

            tank.target.should.not.equal(-1);

            tank.go();

            tank.target.should.equal(-1);

            interceptSpy.should.not.have.been.called;
            motionSpy.should.have.been.called;
          });

          it( 'should trigger scope-resume event', function () {
            var
              motionSpy = sinon.spy(),
              interceptSpy = sinon.spy(function () {
                return true;
              })
            ;

            pkgDef.on('scope', function () {
              pkgDef.off('scope');
              tank.stop();
            });
            pkgDef.on('intercept', interceptSpy);
            pkgDef.on('scope-resume', motionSpy);

            tank.go(1);

            tank.target.should.not.equal(-1);

            tank.go();

            tank.target.should.equal(-1);

            interceptSpy.should.not.have.been.called;
            motionSpy.should.have.been.called;
          });

      });

      describe( 'on a gate event', function () {

        it( 'should not resume any motion event', function () {
          var
            motionSpy = sinon.spy(),
            gateEvents = ['begin', 'move', 'engage']
          ;

          pkgDef.on(['switch-resume', 'scope-resume', 'traverse-resume'], motionSpy);

          gateEvents.forEach(function (eventName) {
            tank.go(0);

            pkgDef.on(eventName, function tmp() {
              pkgDef.off(eventName, tmp);
              tank.stop();
            });

            tank.go(2);

            tank.target.should.not.equal(-1);

            tank.go();

            tank.target.should.equal(-1);
          });

          motionSpy.should.not.have.been.called;
        });

      });

    });

    describe( 'when navigation has been queued', function () {

      var tankA, tankB;

      beforeEach(function () {
        tankA = tank;
        tankB = pkgDef(new Klass()).tank;
      });

      it( 'should remove queue behavior', function () {
        var spy = sinon.spy(function (e) {
          e.tid.should.not.equal(tankA.id, 'queue behavior still exists');
        });

        tankA.queue(tankB, 5);
        tankA.queued.should.be.true;
        tankA.index.should.equal(0);

        tankA.go(2);
        tankA.queued.should.be.false;
        tankA.index.should.equal(2);

        pkgDef.on('begin', spy);

        tankB.go();
        spy.should.have.been.called;
        tankA.index.should.equal(2);
      });

    });

    describe( 'while navigating', function () {

      it( 'should redirect the tank', function () {
        pkgDef.on('move', function () {
          tank.target.should.equal(1);
          tank.go(4);
          tank.target.should.equal(4);
        });

        tank.go(1);
        tank.index.should.equal(4);
      });

      it( 'should reverse calls to `.stop()`, when made from the same package', function () {
        var spy = sinon.spy();

        pkgDef.on('begin', function () {
          pkgDef.off('begin');
          tank.stop();
          pkgDef.on('begin', spy);
        });
        pkgDef.on('end', function () {
          tank.go();
        });

        tank.go(1);
        spy.should.have.been.called;
      });

    });

    describe( 'resolved value', function () {

      it( 'should be an object', function () {
        return tank.go()
          .then(function (obj) {
            expect(obj).to.be.an('object');
          });
      });

      describe( '.id', function () {

        it( 'should be a numeric identifier for this call', function () {
          return tank.go()
            .then(function (obj) {
              expect(obj.id).to.be.a('number');
            });
        });

        it( 'should reflect `tank.cc`, after invocation`', function () {
          var
            prevCC = tank.cc,
            promise = tank.go(),
            curCC = tank.cc
          ;

          expect(prevCC).to.not.equal(curCC);

          return promise.then(function (obj) {
            obj.id.should.equal(curCC);
          });

        });

      });

      describe( '.from', function () {

        it( 'should be the node index from when the method was invoked', function () {
          var curIdx = tank.index;
          return tank.go().then(function (obj) {
            expect(obj.from)
              .to.be.a('number')
              .and.equal(curIdx)
            ;
          });
        });

      });

      describe( '.to', function () {

        it( 'should be the node index targeted', function () {
          var tgtIdx = 3;
          return tank.go(tgtIdx).then(function (obj) {
            expect(obj.to)
              .to.be.a('number')
              .and.equal(tgtIdx)
            ;
          });
        });

      });

      describe( '.success', function () {

        it( 'should be `true` when the tank navigated to the target node', function () {
          return tank.go(2).then(function (obj) {
            expect(obj.success).to.be.true;
          });
        });

        it( 'should be `false` if the tank was redirected', function () {
          pkgDef.on('begin', function () {
            tank.go(4);
          });

          return tank.go(2).then(function (obj) {
            expect(obj.success).to.be.false;
          });
        });

        it( 'should not reflect whether the current node has changed', function () {
          var
            tgtIdx = 3,
            promise = tank.go(tgtIdx)
          ;

          tank.go(1);

          return promise.then(function (obj) {
            expect(obj.success).to.be.true;
            tank.index.should.not.equal(tgtIdx);
          });

        });

      });

    });

    describe( 'with delayed parsing', function () {

      it( 'should observe the last target given');

      it( 'should reject the promise of invalid targets');

    });

    describe( 'with delayed initialization', function () {

      it( 'should observe the last target given');

      it( 'should reject the promise of invalid targets');

    });

  });

  describe( '#stop()', function () {

    it( 'should be a method', function () {
      expect(tank.stop).to.be.a('function');
    });

    describe( 'within the loop', function () {

      it( 'should return `true`', function () {
        pkgDef.on('begin', function () {
          expect(tank.stop()).to.be.true;
        });

        tank.go();
      });

      it( 'should stop navigation', function () {
        tank.index.should.equal(0, 'not starting on 0');
        tank.go(1);
        tank.index.should.equal(1, 'not at 1 - control failed');
        tank.go(0);

        pkgDef.on('switch', function () {
          tank.stop();
        });

        tank.index.should.equal(0, 'did not reset to 0');
        tank.go(1);
        tank.index.should.equal(0, 'was not stopped');
      });

      it( 'should be reversed by calling `#go()` before the loop ends', function () {
        var spy = sinon.spy();

        pkgDef.on('begin', function tmp() {
          pkgDef.off('begin', tmp);
          tank.stop();
        });
        pkgDef.on('traverse', spy);
        pkgDef.on('end', function () {
          tank.go();
        });

        tank.go(1);
        spy.should.have.been.called;
      });

      describe( 'across packages', function () {

        var pkgDefB;

        beforeEach(function () {
          pkgDefB = Klass.pkg('b');
          proxy = new Klass(source);
          tank = pkgDef(proxy).tank;
        });

        it( 'should not be reversed by other packages', function () {
          var
            beginSpy = sinon.spy(function () {
              tank.stop();
            }),
            endSpy = sinon.spy(function () {
              tank.go();
            })
          ;
          pkgDef.on('begin', beginSpy);

          pkgDefB.on('end', endSpy);

          tank.go(1);

          tank.target.should.not.equal(-1, 'tank did not stop');

          beginSpy.should.have.been.calledOnce;
          endSpy.should.have.been.calledOnce;
          beginSpy.should.have.been.calledBefore(endSpy);

        });

      });

    });

    describe( 'outside the loop', function () {

      it( 'should return `false`', function () {
        expect(tank.stop()).to.be.false;
      });

    });

  });

  describe( '.stopped', function () {

    it( 'should be a boolean', function () {
      expect(tank.stopped).to.be.a('boolean');
    });

    it( 'should be `false` by default', function () {
      tank.stopped.should.be.false;
    });

    it( 'should be `false` after calling `#go()`', function () {
      var spy = sinon.spy(function () {
        tank.stopped.should.be.false;
        tank.stop();
        tank.stopped.should.be.true;
        tank.go();
        tank.stopped.should.be.false;
      });
      pkgDef.on('begin', spy);

      tank.go(1);

      spy.should.have.been.called;
    });

    describe( 'within the loop', function () {

      it( 'should be `true` after calling `#stop()`', function () {
        var spy = sinon.spy(function () {
          tank.stopped.should.be.false;
          tank.stop();
          tank.stopped.should.be.true;
        });

        pkgDef.on('begin', spy);

        tank.go();

        spy.should.have.been.called;
      });

      it( 'should remain `false` after blocking the current node', function () {
        var spy = sinon.spy(function () {
          tank.stopped.should.be.false;
          tank.block(Promise.resolve());
          tank.stopped.should.be.false;
          pkgDef.off('begin');
        });

        pkgDef.on('begin', spy);

        tank.go(1);

        spy.should.have.been.called;
      });

      it( 'should remain `true` after exiting the loop', function () {
        pkgDef.on('begin', function () {
          tank.stop();
        });

        tank.stopped.should.equal.false;

        tank.go(1);

        tank.stopped.should.equal.true;
      });

    });

    describe( 'outside the loop', function () {

      it( 'should remain `false` after calling `#stop()`', function () {
        tank.stopped.should.be.false;
        tank.stop();
        tank.stopped.should.be.false;
      });

    });

  });

  describe( '#block()', function () {

    it( 'should be a method', function () {
      expect(tank.block).to.be.a('function');
    });

    it( 'should expect two parameters', function () {
      tank.block.should.have.lengthOf(2);
    });

    it( 'should return a new Promise', function () {
      var
        p1 = Promise.resolve(),
        p2 = tank.block(p1)
      ;
      p2.should
        .be.an.instanceOf(Promise)
        .and.not.equal(p1)
      ;
    });

    it( 'should stop and/or prevent navigating the target node(s)', function () {
      var spy = sinon.spy(function () {
        tank.blocked.should.be.true;
      });

      pkgDef.on('intercept', spy);

      tank.block(Promise.resolve(), 1);
      tank.go(2);

      spy.should.have.been.called;
    });

    describe( 'when the first argument is ommitted or not a Promise', function () {

      var nonPromises = [{}, [], '', 'a', 1, 0, -1, true, false, /a/, null, undefined];

      it( 'should throw', function () {
        expect(function () {
          tank.block();
        }).to.throw;

        nonPromises.forEach(function (arg) {
          expect(function () {
            tank.block(arg);
          }).to.throw;
        });
      });

    });

    describe( 'when the second argument is', function () {

      describe( 'omitted', function () {

        it( 'should block the current node', function () {
          var
            curIdx = tank.index,
            promise = tank.block(Promise.resolve()),
            spy = sinon.spy(function (e) {
              tank.blocked.should.be.true;
              e.index.should.equal(curIdx);
            })
          ;

          pkgDef.on('intercept', spy);

          tank.go(1);

          spy.should.have.been.calledOnce;

          return promise.then(function (obj) {
              obj.blocked.should.have.members([curIdx]);
            });
        });

      });

      describe( 'an empty array', function () {

        it( 'should throw', function () {
          expect(function () {
            tank.block(Promise.resolve(), []);
          }).to.throw;
        });

      });

      describe( 'a valid index', function () {

        it( 'should prevent accessing the given node', function () {
          var
            validIndex = 2,
            promise = tank.block(Promise.resolve(), validIndex),
            spy = sinon.spy(function (e) {
              tank.blocked.should.be.true;
              e.index.should.not.equal(validIndex);
            })
          ;

          pkgDef.on('intercept', spy);

          tank.go(3);

          tank.index.should.not.equal(validIndex, 'navigated to blocked node');

          spy.should.have.been.calledOnce;

          return promise.then(function (obj) {
              obj.blocked.should.have.members([validIndex]);
            });
        });

      });

      describe( 'an array of valid indexes', function () {

        var indices;

        beforeEach(function () {
          indices = [3, 6, 8];
        });

        it( 'should block the given nodes', function () {
          var promise = tank.block(Promise.resolve(), indices);

          indices.forEach(function (index) {
            var spy = sinon.spy(function (e) {
              tank.blocked.should.be.true;
              e.index.should.not.equal(index);
            });

            pkgDef.on('intercept', spy);
            tank.go(index);
            spy.should.have.been.calledOnce;
            pkgDef.off();
          });

          return promise.then(function (obj) {
              obj.blocked.should.have.members(indices);
            });
        });

        it( 'should work fine with duplicates', function () {
          var promise = tank.block(Promise.resolve(), indices.concat(indices));

          indices.forEach(function (index) {
            var spy = sinon.spy(function (e) {
              tank.blocked.should.be.true;
              e.index.should.not.equal(index);
            });

            pkgDef.on('intercept', spy);
            tank.go(index);
            spy.should.have.been.calledOnce;
            pkgDef.off();
          });

          return promise.then(function (obj) {
              obj.blocked.should.have.members(indices);
            });

        });

      });

      describe( 'an invalid index or array with an invalid index', function () {

        it( 'should throw', function () {
          var vow = Promise.resolve();

          expect(function () {
            tank.block(vow);
          }).to.throw;

          invalidIndice.forEach(function (arg) {
            expect(function () {
              tank.block(vow, arg);
            }).to.throw;
          });
        });

      });

      describe( '`true`', function () {

        describe( 'within the loop towards a target', function () {

          it( 'should block the next node in the path', function () {
            tank.go(1);

            pkgDef.on('move', function () {
              pkgDef.off('move');
              tank.block(Promise.resolve(), true);
            });

            tank.go(2);

            tank.index.should.equal(1);

            tank.go(0);
          });

          it( 'should behave similar to returning a Promise', function () {
            tank.go(1);

            pkgDef.on('move', function () {
              pkgDef.off('move');
              return Promise.resolve();
            });

            tank.go(2);

            tank.index.should.equal(1);

            tank.go(0);
          });

        });

        describe( 'within the loop, stopped, and towards a target', function () {

          it( 'should block the next node in the path', function () {
            var spy = sinon.spy();

            pkgDef.on('intercept', spy);

            tank.go(1);

            pkgDef.on('begin', function () {
              pkgDef.off('begin');
              tank.stop();
            });

            pkgDef.on('end', function () {
              pkgDef.off('end');
              tank.stopped.should.be.true;
              tank.block(Promise.resolve(), true);
            });

            tank.go(2);

            tank.index.should.equal(1);
            spy.should.not.have.been.called;

            tank.go();
            spy.should.have.been.calledOnce;

            tank.go(0);
            spy.should.have.been.calledOnce;
          });

          it( 'should behave similar to returning a Promise', function () {
            var spy = sinon.spy();

            pkgDef.on('intercept', spy);

            tank.go(1);

            pkgDef.on('begin', function () {
              pkgDef.off('begin');
              tank.stop();
            });

            pkgDef.on('end', function () {
              pkgDef.off('end');
              tank.stopped.should.be.true;
              return Promise.resolve();
            });

            tank.go(2);

            tank.index.should.equal(1);
            spy.should.not.have.been.called;

            tank.go();
            spy.should.have.been.calledOnce;

            tank.go(0);
            spy.should.have.been.calledOnce;
          });

        });

        describe( 'within the loop without a target', function () {

          it( 'should block the current node', function () {
            var spy = sinon.spy();

            pkgDef
              .on('intercept', spy)
              .on('idle', function () {
                pkgDef.off('idle');
                tank.target.should.equal(-1);
                tank.block(Promise.resolve(), true);
              });

            tank.go(3);
            tank.index.should.equal(3);
            spy.should.not.have.been.called;

            tank.go(0);
            tank.index.should.equal(3);
            spy.should.have.been.calledOnce;
          });

          it( 'should behave similar to returning a Promise', function () {
            var spy = sinon.spy();

            pkgDef
              .on('intercept', spy)
              .on('idle', function () {
                pkgDef.off('idle');
                tank.target.should.equal(-1);
                return Promise.resolve();
              });

            tank.go(3);
            tank.index.should.equal(3);
            spy.should.not.have.been.called;

            tank.go(0);
            tank.index.should.equal(3);
            spy.should.have.been.calledOnce;
          });

        });

        describe( 'stopped and outside the loop (with a target)', function () {

          it( 'should block the current node', function () {
            var spy = sinon.spy();

            pkgDef.on('intercept', spy);

            tank.go(1);
            tank.index.should.equal(1);
            spy.should.not.have.been.called;

            pkgDef
              .on('begin', function () {
                pkgDef.off('begin');
                tank.stop();
              })
              .on('end', function () {
                pkgDef.off('end');
                tank.stopped.should.be.true;
              });

            tank.go(2);
            tank.index.should.equal(1);
            spy.should.not.have.been.called;

            tank.block(Promise.resolve(), true);
            tank.go(1);

            tank.index.should.equal(1);
            spy.should.have.been.calledOnce;
          });

        });

        describe( 'outside the loop without a target', function () {

          it( 'should block the current node', function () {
            var spy = sinon.spy();

            pkgDef.on('intercept', spy);

            tank.index.should.equal(0);
            tank.target.should.equal(-1);

            tank.block(Promise.resolve(), true);
            tank.go(3);

            tank.index.should.equal(0);
            spy.should.have.been.calledOnce;
          });

        });

      });

    });

    describe( 'when the Promise resolves', function () {

      it( 'should release the targeted node(s) for navigation', function () {
        var promise = tank.block(Promise.resolve(), 1);

        tank.go(2);

        return promise.then(function () {
          var spy = sinon.spy();

          pkgDef.on('intercept', spy);

          tank.go(5);
          tank.go(0);

          spy.should.not.have.been.called;
        });

      });

      it( 'should resume an interupted navigation', function () {
        var
          targetIndex = 3,
          promise = tank.block(Promise.resolve(), 1),
          spy = sinon.spy()
        ;

        pkgDef.on('intercept', spy);

        tank.go(targetIndex);

        spy.should.have.been.called;

        return promise.then(function () {
          tank.index.should.equal(targetIndex);
        });
      });

      it( 'should not resume queued navigation', function () {
        var
          tank1 = pkgDef(new Klass()).tank,
          tgtIdx = 2
        ;

        tank.queue(tank1, tgtIdx);

        return tank.block(Promise.resolve()).then(function () {
          tank.index.should.equal(0, 'queued navigation was triggered after block');

          tank1.go();

          tank.index.should.equal(tgtIdx, 'did not navigate after queue target completed');
        });
      });

    });

    describe( 'when the Promise rejects', function () {

      it( 'should pass along rejection/error', function () {
        var
          targetIndex = 1,
          promise = tank.block(Promise.reject(), targetIndex),
          spy = sinon.spy()
        ;

        tank.go(2);

        return promise
          .catch(spy)
          .then(function () {
            spy.should.have.been.called;
          });
      });

      it( 'should release the targeted node(s) for navigation', function () {
        var
          targetIndex = 1,
          promise = tank.block(Promise.reject(), targetIndex),
          catchSpy = sinon.spy()
        ;

        tank.go(2);

        return promise
          .catch(catchSpy)
          .then(function () {
            var interceptSpy = sinon.spy();

            pkgDef.on('intercept', interceptSpy);

            tank.go(5);
            tank.go(0);

            catchSpy.should.have.been.called;
            interceptSpy.should.not.have.been.called;
          });

      });

      it( 'should not resume an interupted navigation', function () {
        var
          targetIndex = 3,
          blockIndex = 1,
          promise = tank.block(Promise.reject(), blockIndex),
          spy = sinon.spy()
        ;

        tank.go(targetIndex);

        return promise
          .catch(spy)
          .then(function () {
            spy.should.have.been.called;
            tank.index.should.not.equal(targetIndex);
            tank.index.should.equal(0);
          });
      });

    });

    describe( 'resolved value', function () {

      it( 'should be an object', function () {
        return tank.block(Promise.resolve())
          .then(function (val) {
            expect(val).to.be.an('object');
          });
      });

      describe( '.from', function () {

        it( 'should be the node index when the method was invoked', function () {
          var curIdx = tank.index;

          return tank.block(Promise.resolve())
            .then(function (obj) {
              expect(obj.from).to.equal(curIdx);
            });
        });

      });

      describe( '.blocked', function () {

        it( 'should be an array of node indices this call blocked', function () {
          var indices = [0, 1, 2];

          return tank.block(Promise.resolve(), indices)
            .then(function (obj) {
              expect(obj.blocked)
                .to.be.an('array')
                .and.eql(indices)
                .and.not.equal(indices);
            });
        });

      });

      describe( '.released', function () {
        var indices = [0, 1, 2];

        it( 'should be a subset of nodes in `.blocked` that are now navigable', function () {
          return tank.block(Promise.resolve(), indices)
            .then(function (obj) {
              obj.released.should.have.members(obj.blocked);
            });
        });

        it( 'should not contain nodes with more than one block', function () {
          var firstBlock = tank.block(Promise.resolve(), indices);

          // second block
          tank.block(Promise.resolve(), indices[0]);

          return firstBlock
            .then(function (obj) {
              obj.released.should
                .include.members([indices[1], indices[2]])
                .and.not.include.members([indices[0]]);
            });
        });

      });

    });

    describe( 'when targeting a node with multiple, staggered Promises', function () {

      it( 'should release when the last Promise resolves', function () {
        return Promise.all([
            tank.block(
              new Promise(function (resolve) {
                setTimeout(function () {
                  resolve();
                }, 15);
              }),
              1
            ).then(function (obj) {
              obj.released.should.have.members([1]);
              obj.blocked.should.have.members([1]);
            }),
            tank.block(
              new Promise(function (resolve) {
                setTimeout(function () {
                  resolve();
                }, 10);
              }),
              1
            ).then(function (obj) {
              obj.blocked.should.have.members([1]);
              obj.released.should.be.empty;
            }),
            tank.block(Promise.resolve(), 1)
              .then(function (obj) {
                obj.blocked.should.have.members([1]);
                obj.released.should.be.empty;
              })
          ]);
      });

    });

  });

  describe( '.blocked', function () {

    it( 'should be a boolean', function () {
      expect(tank.blocked).to.be.a('boolean');
    });

    it( 'should be `false` by default', function () {
      tank.blocked.should.be.false;
    });

    it( 'should be `true` after calling `#block()` for the current node', function () {
      tank.blocked.should.be.false;

      tank.block(Promise.resolve());

      tank.blocked.should.be.true;
    });

  });

  describe( '#queue()', function () {

    var
      instA,
      instB,
      tankA,
      tankB
    ;

    beforeEach(function () {
      instA = pkgInst;
      tankA = tank;

      instB = pkgDef(new Klass(source));
      tankB = instB.tank;
    });

    it( 'should be a method', function () {
      expect(tank.queue).to.be.a('function');
    });

    it( 'should expect two arguments', function () {
      tank.queue.should.have.lengthOf(2);
    });

    it( 'should return a promise', function () {
      expect(tank.queue(instB)).to.be.an.instanceOf(Promise);
    });

    it( 'should bind navigation to the completion of another tank', function () {
      var aTgt = 5;

      tankA.index.should.equal(0);

      tankA.queue(tankB, aTgt);

      tankA.index.should.equal(0);

      tankB.go(1);

      tankA.index.should.equal(aTgt);
    });

    it( 'should bind navigation to the last completed tank', function () {
      var
        tank1 = pkgDef(new Klass()).tank,
        tank2 = pkgDef(new Klass()).tank,
        tank3 = pkgDef(new Klass()).tank,
        promise,
        lastTid
      ;

      promise = tank.queue(tank1);
      tank.queue(tank2);
      tank.queue(tank3);

      pkgDef
        .on('begin', function (e) {
          var inst = this;

          // skip tank
          if (e.tid === tank.id) {
            return;
          }

          if (!inst.delayed) {
            inst.delayed = 1;
            return Promise.resolve();
          }
        })
        .on('end', function (e) {
          lastTid = e.tid;
        })
      ;

      tank1.go();
      tank2.go();
      tank3.go();

      tank1.blocked.should.be.true;
      tank2.blocked.should.be.true;
      tank3.blocked.should.be.true;

      return promise.then(function () {
        expect(lastTid).to.equal(tank.id);
      });
    });

    it( 'should trigger navigation after "end" event of the target tank', function () {
      var tracer = [];

      pkgDef.on(['begin', 'end'], function (e) {
        tracer.push(e.tid);
      });

      tankA.queue(tankB, 1);

      tankB.go(1);

      tracer.should.eql([tankB.id, tankB.id, tankA.id, tankA.id]);
    });

    it( 'should allow linking navigation between instances', function () {

    });

    describe.skip( 'with delayed initialization', function () {

      var tankC, instC;

      beforeEach(function () {
        pkgDef.on('init', function () {
          pkgDef.off('init');
          return new Promise(function (resolve) {
            setTimeout(resolve, 20);
          });
        });

        // return Klass(source).then(function (proxy) {
        //   instC = pkgDef(proxy);
        //   tankC = instC.tank;
        // });
      });

      it( 'should allow linking navigation, of delayed instances', function () {
        var
          proxyC = new Klass(),
          tracer = []
        ;

        pkgDef.on(['begin', 'end'], function (e) {
          tracer.push(e.tid);
        });

        tankB.queue(tankC);
        tankC
      });

    });

    describe( 'when the first argument is', function () {

      describe( 'a proxy', function () {

        it( 'should work per usual', function () {
          tankA.index.should.equal(0);

          tankA.queue(instB.proxy, 1);

          tankB.go();

          tankA.index.should.equal(1);
        });

      });

      describe( 'a package instance', function () {

        it( 'should work per usual', function () {
          tankA.index.should.equal(0);

          tankA.queue(instB, 1);

          tankB.go();

          tankA.index.should.equal(1);
        });

      });

      describe( 'a tank object', function () {

        it( 'should work per usual', function () {
          tankA.index.should.equal(0);

          tankA.queue(tankB, 1);

          tankB.go();

          tankA.index.should.equal(1);
        });

      });

      describe( 'omitted', function () {

        it( 'should throw', function () {

          expect(function () {
            tankA.queue();
          }).to.throw;

          tankA.queued.should.be.false;
        });

      });

      describe( 'not a proxy, package instance, or tank object', function () {

        it( 'should throw', function () {

          [function () {}, [], {}, /s/, '', 0, 1, -1, 'abc'].forEach(function (arg) {
            expect(function () {
              tankA.queue(arg);
            }).to.throw;
          });

          tankA.queued.should.be.false;
        });

      });

    });

    describe( 'when the second argument is', function () {


      describe( 'a valid index', function () {

        it( 'should change the tank index', function () {
          var targetIndex = 2;

          tankA.target.should.equal(-1);

          tankA.queue(tankB, targetIndex);

          tankA.target.should.equal(targetIndex);
        });

        it( 'should navigate there once the target tank completes', function () {
          var targetIndex = 2;

          tankA.index.should.equal(0);
          tankA.queue(tankB, targetIndex);

          tankB.go();

          tankA.index.should.equal(targetIndex);
        });

      });

      describe( 'an invalid index or non-numeric value', function () {

        it( 'should throw', function () {
          invalidIndice.forEach(function (val) {
            expect(function () {
              tank.queue(tankB, val);
            }).to.throw;
          });
        });

      });

      describe( 'omitted', function () {

        it( 'should resume an interrupted navigation', function () {
          var targetIndex = 3;

          pkgDef.on('begin', function () {
            pkgDef.off('begin');
            tank.stop();
          });

          tankA.go(targetIndex);
          tankA.index.should.not.equal(targetIndex);

          tankA.queue(tankB);

          tankB.go();
          tankA.index.should.equal(targetIndex);
        });

        it( 'should trigger the "begin" and "end" events', function () {
          var
            beginSpy = sinon.spy(),
            endSpy = sinon.spy()
          ;

          pkgDef
            .on('begin', beginSpy)
            .on('end', endSpy)
          ;

          tankA.queue(tankB);

          tankB.go();

          beginSpy.should.have.been.calledTwice;
          endSpy.should.have.been.calledTwice;
        });

      });

    });

    describe( 'within the loop', function () {

      it( 'should stop navigation', function () {
        var spy = sinon.spy();

        pkgDef
          .on('switch', function () {
            tankA.queue(tankB);
          })
          .on('switch-resume', spy)
        ;

        tankA.go(1);
        tankA.index.should.equal(0);
        tankA.stopped.should.be.false;
        tankA.blocked.should.be.false;
        tankA.queued.should.be.true;

        tankB.go();
        tankA.index.should.equal(1);
        spy.should.have.been.calledOnce;
      });

    });

    describe( 'with different Klass constructors', function () {
      var
        Klass2,
        tank2
      ;

      beforeEach(function () {
        Klass2 = Panzer.create();
        tank2 = Klass2.pkg('foo')(new Klass2()).tank;
      });

      it( 'should work with other proxy, package or tank instances', function () {
        var tgtIdx = 5;

        tankA.queue(tank2, tgtIdx);
        tankA.queued.should.be.true;

        tank2.go(1);
        tankA.index.should.equal(tgtIdx);
      });

    });

    describe( 'resolved value', function () {

      it( 'should be an object', function () {
        var promise = tankA.queue(tankB);

        tankB.go(1);

        return promise.then(function (obj) {
          expect(obj).to.be.an('object');
        });
      });

      describe( '.id', function () {

        it( 'should be a numeric identifier for this call', function () {
          var promise = tankA.queue(tankB);

          tankB.go(1);

          return promise.then(function (obj) {
            expect(obj.id).to.be.a('number');
          });
        });

        it( 'should reflect `tank.cc`, after invocation`', function () {
          var
            prevCC = tankA.cc,
            promise = tankA.queue(tankB),
            curCC = tankA.cc
          ;

          expect(prevCC).to.not.equal(curCC);

          tankB.go(1);

          return promise.then(function (obj) {
            obj.id.should.equal(curCC);
          });

        });

      });

      describe( '.from', function () {

        it( 'should be the node index from when the method was invoked', function () {
          var
            curIdx = tankA.index,
            promise = tankA.queue(tankB)
          ;

          tankB.go();

          return promise.then(function (obj) {
            expect(obj.from)
              .to.be.a('number')
              .and.equal(curIdx)
            ;
          });
        });

      });

      describe( '.to', function () {

        it( 'should be the node index targeted', function () {
          var
            tgtIdx = 3,
            promise = tankA.queue(tankB, tgtIdx)
          ;

          tankB.go();

          return promise.then(function (obj) {
            expect(obj.to)
              .to.be.a('number')
              .and.equal(tgtIdx)
            ;
          });
        });

        it( 'should be the -1, when no node was targeted', function () {
          var promise = tankA.queue(tankB);

          tankB.go();

          return promise.then(function (obj) {
            expect(obj.to)
              .to.be.a('number')
              .and.equal(-1)
            ;
          });
        });

      });

      describe( '.success', function () {

        it( 'should be `true` when the tank navigated to the target node', function () {
          var
            tgtIdx = 2,
            promise = tankA.queue(tankB, tgtIdx)
          ;

          tankA.index.should.not.equal(tgtIdx);

          tankB.go();

          tankA.index.should.equal(tgtIdx);

          return promise.then(function (obj) {
            tankA.index.should.equal(tgtIdx);
            expect(obj.success).to.be.true;
          });
        });

        it( 'should be `false` if the tank was redirected', function () {
          var
            tgtIdx = 2,
            redirectIdx = 4,
            promise = tankA.queue(tankB, tgtIdx)
          ;

          pkgDef.on('begin', function () {
            tankA.go(redirectIdx);
          });

          tankA.index.should.not.equal(tgtIdx);

          tankB.go();

          tankA.index.should.not.equal(tgtIdx);
          tankA.index.should.equal(redirectIdx);

          return promise.then(function (obj) {
            tankA.index.should.not.equal(tgtIdx);
            tankA.index.should.equal(redirectIdx);
            expect(obj.success).to.be.false;
          });
        });

        it( 'should not reflect whether the current node has changed', function () {
          var
            tgtIdx = 2,
            redirectIdx = 4,
            promise = tankA.queue(tankB, tgtIdx)
          ;

          tankA.index.should.not.equal(tgtIdx);

          tankB.go();

          tankA.index.should.equal(tgtIdx);

          tankA.go(redirectIdx);

          tankA.index.should.equal(redirectIdx);

          return promise.then(function (obj) {
            tankA.index.should.not.equal(tgtIdx);
            tankA.index.should.equal(redirectIdx);
            expect(obj.success).to.be.true;
          });
        });

      });

    });

  });

  describe( '.queued', function () {

    var
      instA,
      instB,
      tankA,
      tankB
    ;

    beforeEach(function () {
      instA = pkgInst;
      tankA = tank;

      instB = pkgDef(new Klass(source));
      tankB = instB.tank;
    });

    it( 'should be a boolean', function () {
      expect(tank.queued).to.be.a('boolean');
    });

    it( 'should be `false`, by default', function () {
      tank.queued.should.be.false;
    });

    it( 'should be `true` after calling `#queue()', function () {
      tankA.queue(tankB);
      tankA.queued.should.be.true;
    });

    describe( 'when queued', function () {

      it( 'should be `false` after calling `#go()`', function () {
        tankA.queue(tankB);
        tankA.queued.should.be.true;

        tankA.go();

        tankA.queued.should.be.false;
      });

      it( 'should be `true` after directing the queue target', function () {
        tankA.queue(tankB);
        tankA.queued.should.be.true;

        tankA.go();

        tankA.queued.should.be.false;
      });

      it( 'should remain `true` until all target tanks are complete', function () {
        var tank1 = pkgDef(new Klass()).tank;

        tankA.queue(tankB);
        tankA.queue(tank1);
        tankA.queued.should.be.true;

        tankB.go();
        tankA.queued.should.be.true;

        tank1.go();
        tankA.queued.should.be.false;
      });

    });

  });

});