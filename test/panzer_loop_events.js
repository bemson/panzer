describe( 'Loop', function () {

  var
    Klass,
    pkgDef,
    pkgInst,
    tank,
    eventNames = [
      'begin', 'end', 'move', 'idle', 'engage',
      'switch', 'switch-resume', 'release',
      'scope', 'scope-resume', 'traverse', 'traverse-resume',
      'intercept'
    ],
    source,
    spies
  ;

  beforeEach(function () {
    source = {a:{b:1,c:4},d:{f:1,g:{h:3,k:9}}};
    Klass = Panzer.create();
    pkgDef = Klass.pkg('a');
    pkgInst = pkgDef(new Klass(source));
    tank = pkgInst.tank;
    spies = {};
    eventNames.forEach(function (eventName) {
      var spy = sinon.spy();

      spies[eventName.replace('-', '_')] = spy;
      pkgDef.on(eventName, spy);
    });
  });

  describe('callbacks', function () {

    var spied;

    beforeEach(function () {

      spied = Object.keys(spies).map(function (eventName) {
        return spies[eventName];
      });

      // trigger all spies
      pkgDef.on(['switch', 'traverse', 'scope'], function tmp(e) {
        pkgDef.off(e.type, tmp);
        tank.stop();
      });
      tank.go(pkgInst.nodes.length - 1);       // stopped
      tank.go();                            // resumes
      tank.go();                            // resumes
      pkgDef.on('release', function tmp() {
        pkgDef.off('release', tmp);
        return Promise.resolve();
      });
      tank.go();                            // resumes
      tank.go();                            // intercept
    });

    it( 'should be scoped to their package-instance', function () {
      spied.forEach(function (spy) {
        spy.getCall(0).should.have.been.calledOn(pkgInst);
      });
    });

    it( 'should receive an object', function () {
      spied.forEach(function (spy) {
        expect(spy.getCall(0).args[0]).to.be.an('object');
      });
    });

  });

  describe( 'navigation', function () {

    it( 'should change the tank index, by calling `tank.go()`', function () {
      tank.index.should.equal(0);
      tank.go(1);
      tank.index.should.equal(1);
    });

    it( 'should end after traversing _on_ the destination index and `tank.target` is -1', function () {
      var
        idleTankTarget,
        traverseTankTarget,
        idleSpy = sinon.spy(function () {
          idleTankTarget = tank.target;
        }),
        traverseSpy = sinon.spy(function () {
          traverseTankTarget = tank.target;
        })
      ;

      pkgDef.on('idle', idleSpy);
      pkgDef.on('traverse', traverseSpy);

      tank.go(1);

      tank.index.should.equal(1);

      traverseSpy.should.have.been.calledTwice;
      idleSpy.should.have.been.calledOnce;

      idleSpy.should.have.been.calledAfter(traverseSpy);

      expect(traverseTankTarget).to.equal(1);
      expect(idleTankTarget).to.equal(-1);
    });

    describe( 'stopping', function () {

      it( 'should occur when a callback invokes `tank.stop()`', function () {
        var spy = sinon.spy(function (e) {
          tank.stopped.should.be.true;
        });

        pkgDef
          .on('begin', function (e) {
            tank.stopped.should.be.false;
            tank.stop();
          })
          .on('begin', spy);

        tank.go(1);

        spy.should.have.been.called;
      });

      it( 'should prevent traversing the destination node index', function () {
        var
          destinationIndex = 1,
          spy = sinon.spy(function () {
            tank.stop();
          })
        ;

        pkgDef.on('move', spy);

        tank.index.should.not.equal(destinationIndex);
        spy.should.not.have.been.called;

        tank.go(destinationIndex);

        tank.index.should.not.equal(destinationIndex);
        spy.should.have.been.called;
      });

      it( 'should cease by calling `tank.go()` again', function () {
        pkgDef.on('begin', function () {
          pkgDef.off();
          tank.stop();
        });

        tank.go(1);
        tank.index.should.not.equal(1);

        tank.go();
        tank.index.should.equal(1);
      });

    });

    describe( 'blocking', function () {

      it( 'should occur when a callback invokes `tank.block()`', function () {
        var spy = sinon.spy(function (e) {
          tank.blocked.should.be.true;
        });

        pkgDef
          .on('begin', function (e) {
            tank.blocked.should.be.false;
            tank.block(Promise.resolve());
          })
          .on('begin', spy);

        tank.go(1);

        pkgDef.off();

        spy.should.have.been.called;
      });

      it( 'should occur when a callback returns a Promise', function () {
        var spy = sinon.spy(function (e) {
          tank.blocked.should.be.true;
        });

        pkgDef
          .on('begin', function () {
            return Promise.resolve();
          })
          .on('begin', spy)
        ;

        tank.go(1);
        pkgDef.off();

        spy.should.have.been.called;
      });

      it( 'should prevent traversing the destination node index', function () {
        var
          destinationIndex = 1,
          spy = sinon.spy(function () {
            pkgDef.off();
            return Promise.resolve();
          })
        ;

        pkgDef.on('move', spy);

        tank.index.should.not.equal(destinationIndex);
        spy.should.not.have.been.called;

        tank.go(destinationIndex);

        tank.index.should.not.equal(destinationIndex);
        spy.should.have.been.called;
      });

      it( 'should cease once the Promise resolves', function () {
        pkgDef.on('begin', function () {
          pkgDef.off('begin');
          return Promise.resolve();
        });

        return tank.go(1)
          .then(function () {
            tank.index.should.equal(1);
          });
      });

      it( 'should persist while callbacks return Promises', function () {
        var
          max = 10,
          spy = sinon.spy(function (e) {
            tank.blocked.should.be.true;
            if (e.tally.proxy === max) {
              pkgDef.off();
            }
          })
        ;

        pkgDef
          .on('begin', function () {
            return Promise.resolve();
          })
          .on('begin', spy)
        ;

        return tank.go(1)
          .then(function () {
            spy.callCount.should.equal(max);
          });
      });

      describe( 'attempts in the same direction', function () {

        it( 'should result in the "intercept" event', function () {
          var spy = sinon.spy();

          pkgDef
            .on('begin', function () {
              pkgDef.off('begin');
              return Promise.resolve();
            })
            .on('intercept', spy)
          ;

          tank.go(1);

          tank.target.should.not.equal(-1);

          tank.go();

          spy.should.have.been.calledOnce;
        });

      });

      describe( 'attempts in a different direction', function () {

        it( 'should not result in an "intercept" event', function () {
          var interceptSpy = sinon.spy();

          pkgDef
            .on('begin', function () {
              return Promise.resolve();
            })
            .on('intercept', interceptSpy)
          ;

          tank.go(1);
          pkgDef.off('begin');

          tank.target.should.not.equal(-1);

          tank.go(0);

          interceptSpy.should.not.have.been.called;
        });

      });

    });

  });

  describe( 'gate event', function () {

    describe( '"begin"', function () {

      it( 'should fire before all other loop events', function () {
        var beginSpy = spies.begin;

        tank.go(4);

        delete spies.begin;

        Object.keys(spies).forEach(function (key) {
          beginSpy.should.have.been.calledBefore(spies[key]);
        });
      });

      it( 'should fire after directing the `tank`', function () {
        spies.begin.should.not.have.been.called;

        tank.go(1);

        spies.begin.should.have.been.calledOnce;
      });

      it( 'should fire when directed nowhere', function () {
        tank.go();

        spies.begin.should.have.been.calledOnce;
      });

      it( 'should repeat when `tank.go()` is called in the "end" event', function () {
        var endSpy = sinon.spy(function () {
          pkgDef.off('end', endSpy);
          this.tank.go(0);
        });

        pkgDef.on('end', endSpy);
        tank.go(1);

        endSpy.should.have.been.calledOnce;
        spies.begin.should.have.been.calledTwice;
        spies.end.should.have.been.calledTwice;
      });

      describe( 'when it\'s stopping', function () {

        it( 'should skip all but the "end" event', function () {

          pkgDef.on('begin', function () {
            tank.stop();
          });

          tank.go(1);

          spies.begin.should.have.been.calledOnce;
          spies.end.should.have.been.calledOnce;

          // delete tested spies
          delete spies.begin;
          delete spies.end;

          Object.keys(spies).forEach(function (key) {
            spies[key].should.not.have.been.called;
          });
        });

      });

      describe( 'when it\'s blocking', function () {

        it( 'should skip all but the "end" event', function () {
          var promise;

          pkgDef.on('begin', function tmp() {
            pkgDef.off('begin', tmp);
            return Promise.resolve();
          });

          promise = tank.go(1);

          spies.begin.should.have.been.calledOnce;
          spies.end.should.have.been.calledOnce;

          // delete tested spies
          delete spies.begin;
          delete spies.end;

          Object.keys(spies).forEach(function (key) {
            spies[key].should.not.have.been.called;
          });

          return promise;
        });

      });

    });

    describe( '"move"', function () {

      it( 'should fire after the "begin" event', function () {
        tank.go(1);
        spies.move.should.have.been.calledAfter(spies.begin);
      });

      it( 'should fire before the "idle" event', function () {
        tank.go(1);
        spies.move.should.have.been.calledBefore(spies.idle);
      });

      describe( 'when it\'s stopping', function () {

        it( 'should skip all but the "idle" event', function () {
          pkgDef.on('move', function () {
            tank.stop();
          });

          tank.go(1);

          spies.begin.should.have.been.calledOnce;
          spies.move.should.have.been.calledOnce;
          spies.idle.should.have.been.calledOnce;
          spies.end.should.have.been.calledOnce;

          // delete tested spies
          delete spies.begin;
          delete spies.move;
          delete spies.idle;
          delete spies.end;

          Object.keys(spies).forEach(function (key) {
            spies[key].should.not.have.been.called;
          });
        });

      });

      describe( 'when it\'s blocking', function () {

        it( 'should skip all but the "idle" event', function () {
          var promise;

          pkgDef.on('move', function tmp() {
            pkgDef.off('move', tmp);
            return Promise.resolve();
          });

          promise = tank.go(1);

          spies.begin.should.have.been.calledOnce;
          spies.move.should.have.been.calledOnce;
          spies.idle.should.have.been.calledOnce;
          spies.end.should.have.been.calledOnce;

          // delete tested spies
          delete spies.begin;
          delete spies.move;
          delete spies.idle;
          delete spies.end;

          Object.keys(spies).forEach(function (key) {
            spies[key].should.not.have.been.called;
          });

          return promise;
        });

      });

    });

    describe( '"idle"', function () {

      it( 'should fire ');

    });

    describe( '"end"', function () {

      it( 'should fire after all other loop events', function () {
        var key;

        tank.go(1);

        for (key in spies) {
          if (
            key !== 'end' && key !== 'intercept' &&
            !~key.indexOf('_') &&
            spies.hasOwnProperty(key)
          ) {
            spies[key].should.have.been.calledBefore(spies.end);
          }
        }
      });

      it( 'should not fired when "begin" is intercepted', function () {
        tank.block(Promise.resolve());
        tank.go();

        spies.begin.should.not.have.been.called;
        spies.end.should.not.have.been.called;
        spies.intercept.should.have.been.calledOnce;
      });

      describe( 'when given a new destination', function () {

        it( 'should trigger another "begin" event', function () {
          var
            dest1 = 1,
            dest2 = 2,
            spy = sinon.spy()
          ;

          pkgDef.on('end', function () {
            tank.go(dest2);
            pkgDef.on('begin', spy);
            pkgDef.off('end');
          });

          tank.go(dest1);

          spy.should.have.been.called;
        });

      });

    });

  });

  describe( 'motion event', function () {

  });

});