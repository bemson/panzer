describe( 'Event object', function () {

  var source, Klass, pkgDef, proxy, pkgInst, tank;

  beforeEach(function () {
    source = {a:{b:1,c:4},d:{f:1,g:{h:3,k:9}}};
    Klass = Panzer.create();
    pkgDef = Klass.pkg('a');
    proxy = new Klass(source);
    pkgInst = pkgDef(proxy);
    tank = pkgInst.tank;
  });

  describe( '.id', function () {

    it( 'should be a numeric property', function () {
      var spy = sinon.spy(function (e) {
        expect(e.id).to.be.a('number');
        e.id.should.be.above(0);
      });
      pkgDef.on('begin', spy);
      tank.go();
      spy.should.have.been.called;
    });

    it( 'should increase across events of all Panzer class instances', function () {
      var
        lastId = 0,
        Klass2 = Panzer.create(),
        pkgDef2 = Klass2.pkg('foo'),
        events = ['init', 'begin', 'move', 'idle', 'end', 'traverse', 'scope'],
        spy = sinon.spy(function (e) {
          e.id.should.be.above(lastId);
          lastId = e.id;
        })
      ;

      pkgDef.on(events, spy);
      pkgDef2.on(events, spy);

      pkgDef2(new Klass2()).tank.go(1);
      tank.go(1);

      spy.should.have.been.called;
    });

  });

  describe( '.order', function () {

    it( 'should be a numeric property', function () {
      var spy = sinon.spy(function (e) {
        expect(e.order).to.be.a('number');
        e.order.should.be.above(0);
      });
      pkgDef.on('begin', spy);
      tank.go();
      spy.should.have.been.called;
    });

    it( 'should start with 1, for the "init" event', function () {
      var spy = sinon.spy(function (e) {
        e.order.should.equal(1);
      });

      pkgDef.on('init', spy);

      proxy = new Klass();

      spy.should.have.been.called;
    });

    it( 'should increase per event of an instance', function () {
      var lastOrder = 0;

      pkgDef.on(['begin', 'move', 'idle', 'end'], function (e) {
        e.order.should.be.above(lastOrder);
        lastOrder = e.order;
      });

      tank.go();

      expect(lastOrder).to.be.above(0);
    });

  });

  describe( '.tid', function () {

    it( 'should be a string property', function () {
      var spy = sinon.spy(function (e) {
        expect(e.tid).to.be.a('string');
        e.tid.length.should.be.above(0);
      });
      pkgDef.on('begin', spy);
      tank.go();
      spy.should.have.been.called;
    });

    it( 'should reflect the corresponding tank id', function () {
      var spy = sinon.spy(function (e) {
        e.tid.should.equal(this.tank.id);
      });
      pkgDef.on('begin', spy);
      tank.go();
      spy.should.have.been.called;
    });

  });

  describe( '.trip', function () {

    it( 'should be a numeric property', function () {
      var spy = sinon.spy(function (e) {
        expect(e.trip).to.be.a('number');
        e.trip.should.be.above(0);
      });
      pkgDef.on('begin', spy);
      tank.go();
      spy.should.have.been.called;
    });

    it( 'should increment after each completed navigation', function () {
      var
        lastTripCount,
        spy = sinon.spy(function (e) {
          e.trip.should.equal(lastTripCount + 1);
        })
      ;

      pkgDef.on('begin', function first(e) {
        lastTripCount = e.trip;
      });
      tank.go();

      pkgDef
        .off('begin')
        .on('begin', spy)
      ;

      tank.go();

      spy.should.have.been.called;
    });

    it( 'should be the same across events', function () {
      var
        events = ['begin', 'end', 'move', 'idle', 'engage', 'release', 'switch', 'traverse'],
        expectedTripCount = 1
      ;

      pkgDef.on(events, function (e) {
        var eIdx = events.indexOf(e.type);
        if (~eIdx) {
          events.splice(eIdx, 1);
        }
        e.trip.should.equal(expectedTripCount);
      });
      tank.go(2);
      events.should.have.lengthOf(0);
    });

    it( 'should be the same across events of stopped trips', function () {
      var
        firstCallCount,
        spy = sinon.spy(function (e) {
          e.trip.should.equal(1);
        })
      ;

      pkgDef.on(
        ['begin', 'end', 'move', 'idle', 'engage', 'release', 'switch', 'traverse'],
        spy
      );

      pkgDef.on('move', function tmp() {
        pkgDef.off('move', tmp);
        tank.stop();
      });

      tank.go(4);
      firstCallCount = spy.callCount;
      firstCallCount.should.equal(4);

      tank.go();
      spy.callCount.should.be.above(firstCallCount * 2);
    });

    it( 'should be the same across events of blocked trips', function () {
      var
        spy = sinon.spy(function (e) {
          e.trip.should.equal(1);
        }),
        firstCallCount,
        promise
      ;

      pkgDef.on(
        ['begin', 'end', 'move', 'idle', 'engage', 'release', 'switch', 'traverse'],
        spy
      );

      pkgDef.on('move', function tmp() {
        pkgDef.off('move', tmp);
        return Promise.resolve();
      });

      promise = tank.go(4);

      firstCallCount = spy.callCount;

      // this will fire after unblocked
      pkgDef.on('end', function () {
        spy.callCount.should.be.above(firstCallCount);
      });

      return promise.then(function () {
        spy.should.have.been.called;
      });
    });

    it( 'should be the same across events of queued trips', function () {
      var
        firstCallCount,
        spy = sinon.spy(function (e) {
          e.trip.should.equal(1);
        }),
        pkgDef2 = Klass.pkg('asdf'),
        tankB = pkgDef2(new Klass()).tank
      ;

      pkgDef.on(
        ['begin', 'end', 'move', 'idle', 'engage', 'release', 'switch', 'traverse'],
        spy
      );

      pkgDef.on('move', function tmp() {
        pkgDef.off('move', tmp);
        tank.queue(tankB);
      });

      tank.go(4);
      firstCallCount = spy.callCount;
      firstCallCount.should.equal(4);

      tankB.go();
      spy.callCount.should.be.above(firstCallCount * 2);
    });

  });

  describe( '.leg', function () {

    it( 'should be a numeric property', function () {
      var spy = sinon.spy(function (e) {
        expect(e.leg).to.be.a('number');
        e.leg.should.be.above(0);
      });
      pkgDef.on('begin', spy);
      tank.go();
      spy.should.have.been.called;
    });

    it( 'should be the same across events', function () {
      var
        events = ['begin', 'end', 'move', 'idle', 'engage', 'release', 'switch', 'traverse'],
        expectedTripCount = 1
      ;

      pkgDef.on(events, function (e) {
        var eIdx = events.indexOf(e.type);
        if (~eIdx) {
          events.splice(eIdx, 1);
        }
        e.leg.should.equal(expectedTripCount);
      });
      tank.go(2);
      events.should.have.lengthOf(0);
    });

    it( 'should increment across events between stopped trips', function () {
      var
        lastLegCount,
        spy = sinon.spy(function (e) {
          e.leg.should.be.equal(lastLegCount + 1);
        })
      ;

      pkgDef.on('begin', function (e) {
        lastLegCount = e.leg;
        tank.stop();
        pkgDef.off('begin');
      });

      tank.go(2);

      pkgDef.on('begin', spy);

      tank.go(1);
      spy.should.have.been.called;
    });

    it( 'should increment across events between blocked trips', function () {
      var
        promise,
        firstLegCount,
        secondLegCount
      ;

      pkgDef.on('move', function (e) {
        firstLegCount = e.leg;
        pkgDef.off('move');
        return Promise.resolve();
      });

      promise = tank.go(2);

      pkgDef.on('move', function (e) {
        secondLegCount = e.leg;
      });

      return promise.then(function () {
        secondLegCount.should.equal(firstLegCount + 1);
      });
    });

    it( 'should increment across events between queued trips', function () {
      var
        pkgDef2 = Klass.pkg('asdf'),
        tankB = pkgDef2(new Klass()).tank,
        spy = sinon.spy(function (e) {
          if (e.tid === tank.id) {
            e.leg.should.be.equal(lastLegCount + 1);
          }
        }),
        lastLegCount
      ;

      pkgDef.on('begin', function (e) {
        pkgDef.off('begin');
        lastLegCount = e.leg;
        tank.queue(tankB);
      });

      tank.go(2);

      pkgDef.on('begin', spy);

      tankB.go();
      spy.should.have.been.called;
    });

  });

  describe( '.command', function () {

    it( 'should be a numeric property', function () {
      var spy = sinon.spy(function (e) {
        expect(e.command).to.be.a('number');
        e.command.should.be.above(0);
      });
      pkgDef.on('begin', spy);
      tank.go();
      spy.should.have.been.called;
    });


    it( 'should start as 1', function () {
      var spy = sinon.spy(function (e) {
        e.command.should.equal(1);
      });
      pkgDef.on('begin', spy);
      tank.go();
      spy.should.have.been.called;
    });

    it( 'should reflect the number of calls to `tank.go`', function () {
      var lastCommand;

      pkgDef.on('begin', function (e) {
        lastCommand = e.command;
      });

      tank.go();
      expect(lastCommand).to.be.a('number');
      lastCommand.should.equal(1);

      tank.go();
      tank.go();

      expect(lastCommand).to.equal(3);
    });

    it( 'should be the same between events', function () {
      var beginValue, endValue;

      pkgDef.on(['begin', 'end'], function (e) {
        if (e.type === 'begin') {
          beginValue = e.command;
        } else {
          endValue = e.command;
        }
      });

      tank.go(1);
      tank.go(2);

      expect(beginValue).to.exist;
      expect(endValue).to.exist;
      beginValue.should.equal(endValue);
    });

    it( 'should increment even if no navigation events fire', function () {
      var
        spy = sinon.spy(),
        lastCommand
      ;

      pkgDef.on('begin', function (e) {
        lastCommand = e.command;
        pkgDef.off();
        return Promise.resolve();
      });

      tank.go(1);
      pkgDef.off();

      lastCommand.should.equal(1);

      pkgDef.on('begin', spy);

      tank.go();
      spy.should.not.have.been.called;
      pkgDef.off();

      pkgDef.on('intercept', function (e) {
        lastCommand = e.command;
      });
      tank.go();

      lastCommand.should.equal(3);
    });

  });

  describe( '.type', function () {

    it( 'should be a string property', function () {
      var spy = sinon.spy(function (e) {
        expect(e.type).to.be.a('string');
        e.type.length.should.be.above(0);
      });
      pkgDef.on('begin', spy);
      tank.go();
      spy.should.have.been.called;
    });

    it( 'should reflect the subscribed event name', function () {
      var
        eventName = 'begin',
        spy = sinon.spy(function (e) {
          e.type.should.equal(eventName);
        })
      ;
      pkgDef.on(eventName, spy);
      tank.go();
      spy.should.have.been.called;
    });

  });

  describe( '.index', function () {

    it( 'should be a numeric property', function () {
      var spy = sinon.spy(function (e) {
        expect(e.index).to.be.a('number');
      });

      pkgDef.on('begin', spy);

      tank.go(1);
      spy.should.have.been.called;
    });

    it( 'should reflect the current tank node index', function () {
      var spy = sinon.spy(function (e) {
        e.index.should.equal(tank.index);
      });

      pkgDef.on('traverse', spy);

      tank.go(1);

      spy.callCount.should.be.above(1);
    });

  });

  describe( '.path', function () {

    it( 'should be a string property', function () {
      var spy = sinon.spy(function (e) {
        expect(e.path).to.be.a('string');
      });

      pkgDef.on('begin', spy);

      tank.go(1);
      spy.should.have.been.called;
    });

    it( 'should reflect the current tank node path', function () {
      var spy = sinon.spy(function (e) {
        e.path.should.equal(tank.path);
      });

      pkgDef.on('traverse', spy);

      tank.go(1);

      spy.callCount.should.be.above(1);
    });

  });

  describe( '.depth', function () {

    it( 'should be a numeric property', function () {
      var spy = sinon.spy(function (e) {
        expect(e.depth).to.be.a('number');
      });

      pkgDef.on('begin', spy);

      tank.go(1);
      spy.should.have.been.called;
    });

    it( 'should reflect the current tank node depth', function () {
      var spy = sinon.spy(function (e) {
        e.depth.should.equal(tank.depth);
      });

      pkgDef.on('traverse', spy);

      tank.go(3);

      spy.callCount.should.be.above(1);
    });

  });

  describe( '.stack', function () {

    it( 'should be an array property', function () {
      var spy = sinon.spy(function (e) {
        expect(e.stack).to.be.an('array');
      });

      pkgDef.on('begin', spy);

      tank.go();

      spy.should.have.been.called;
    });

    it( 'should be empty when event has no parent event (e.g., is outside another loop)', function () {
      var spy = sinon.spy(function (e) {
        e.stack.should.be.empty;
      });

      pkgDef.on('begin', spy);

      tank.go();

      spy.should.have.been.called;
    });

    it( 'should host event ancestry of nested loops', function () {
      var
        grandInst = pkgDef(new Klass()),
        parentInst = pkgDef(new Klass()),
        ancestry,
        lastStack
      ;

      pkgDef
        .on('begin', function (e) {
          switch(this) {
            case grandInst:
              parentInst.tank.go();
            break;
            case parentInst:
              pkgInst.tank.go();
            break;
            case pkgInst:
              ancestry = e.stack;
            break;
            // no default
          }
        })
        .on('end', function (e) {
          switch(this) {
            case grandInst:
              lastStack = e.stack;
            break;
            case parentInst:
              e.stack.should.have.lengthOf(1);
            break;
            case pkgInst:
              e.stack.should.have.lengthOf(2);
            break;
            // no default
          }
        })
      ;

      grandInst.tank.go();

      expect(ancestry).to.be.an('array');
      ancestry.should.have.lengthOf(2);
      parentInst.proxy.should.equal(ancestry[0].proxy);
      grandInst.proxy.should.equal(ancestry[1].proxy);

      expect(lastStack).to.be.an('array');
      lastStack.should.have.lengthOf(0);
    });

    describe( 'when stopped', function () {

      it( 'should preserve ancestry', function () {
        var
          spy = sinon.spy(function (e) {
            var stack = e.stack;

            stack.should.have.lengthOf(2);
            stack[0].proxy.should.equal(parentInst.proxy);
            stack[0].type.should.equal(e.type);

            stack[1].proxy.should.equal(grandInst.proxy);
            stack[1].type.should.equal(e.type);
          }),
          grandInst = pkgDef(new Klass()),
          parentInst = pkgDef(new Klass()),
          childInst = pkgInst
        ;

        pkgDef.on('begin', function (e) {
          switch(this) {
            case grandInst:
              e.stack.should.have.lengthOf(0);
              parentInst.tank.go(1);
            break;
            case parentInst:
              e.stack.should.have.lengthOf(1);
              childInst.tank.go(1);
            break;
            case childInst:
              e.stack.should.have.lengthOf(2);
              childInst.tank.stop();
            break;
            // no default
          }
        });

        grandInst.tank.go(1);

        grandInst.tank.index.should.equal(1);
        parentInst.tank.index.should.equal(1);
        childInst.tank.index.should.equal(0);

        grandInst.tank.stopped.should.be.false;
        parentInst.tank.stopped.should.be.false;
        childInst.tank.stopped.should.be.true;

        pkgDef
          .off()
          .on('begin', spy)
        ;

        childInst.tank.go();
        childInst.tank.index.should.equal(1);
        childInst.tank.stopped.should.be.false;
        spy.should.have.been.calledOnce;
      });

      it( 'should clear ancestry afterwards', function () {
        var
          spy = sinon.spy(function (e) {
            e.stack.should.have.lengthOf(0);
          }),
          grandInst = pkgDef(new Klass()),
          parentInst = pkgDef(new Klass()),
          childInst = pkgInst
        ;

        pkgDef.on('begin', function (e) {
          switch(this) {
            case grandInst:
              e.stack.should.have.lengthOf(0);
              parentInst.tank.go(1);
            break;
            case parentInst:
              e.stack.should.have.lengthOf(1);
              childInst.tank.go(1);
            break;
            case childInst:
              pkgDef.off();
              e.stack.should.have.lengthOf(2);
              childInst.tank.stop();
            break;
            // no default
          }
        });

        grandInst.tank.go(1);

        childInst.tank.stopped.should.be.true;

        childInst.tank.go();

        childInst.tank.index.should.equal(1);
        childInst.tank.stopped.should.be.false;

        pkgDef.on('begin', spy);

        childInst.tank.go(0);
        spy.should.have.been.calledOnce;
      });

    });

    describe( 'when blocked by a returned Promise', function () {

      it( 'should preserve ancestry', function () {
        var
          spy = sinon.spy(),
          grandInst = pkgDef(new Klass()),
          parentInst = pkgDef(new Klass()),
          childInst = pkgInst,
          promise
        ;

        pkgDef.on('begin', function (e) {
          switch(this) {
            case grandInst:
              e.stack.should.have.lengthOf(0);
              parentInst.tank.go(1);
            break;
            case parentInst:
              e.stack.should.have.lengthOf(1);
              promise = childInst.tank.go(1);
            break;
            case childInst:
              pkgDef.off('begin');
              e.stack.should.have.lengthOf(2);
              return Promise.resolve();
            // no default
          }
        });

        grandInst.tank.go(1);

        grandInst.tank.index.should.equal(1);
        parentInst.tank.index.should.equal(1);
        childInst.tank.index.should.equal(0);

        grandInst.tank.stopped.should.be.false;
        parentInst.tank.stopped.should.be.false;
        childInst.tank.stopped.should.be.false;
        childInst.tank.blocked.should.be.true;

        pkgDef
          .on('intercept', spy)
          .on('end', function (e) {
            var stack = e.stack;

            stack.should.have.lengthOf(2);
            stack[0].proxy.should.equal(parentInst.proxy);
            stack[0].type.should.equal('begin');

            stack[1].proxy.should.equal(grandInst.proxy);
            stack[1].type.should.equal('begin');
          })
        ;

        // ensures we're blocked
        childInst.tank.go();
        spy.should.have.been.calledOnce;

        return promise.then(function () {
          childInst.tank.index.should.equal(1);
          childInst.tank.stopped.should.be.false;
          spy.should.have.been.calledOnce;
        });
      });

      it( 'should clear ancestry afterwards ', function () {
        var
          interceptSpy = sinon.spy(),
          grandInst = pkgDef(new Klass()),
          parentInst = pkgDef(new Klass()),
          childInst = pkgInst,
          promise
        ;

        pkgDef.on('begin', function (e) {
          switch(this) {
            case grandInst:
              e.stack.should.have.lengthOf(0);
              parentInst.tank.go(1);
            break;
            case parentInst:
              e.stack.should.have.lengthOf(1);
              promise = childInst.tank.go(1);
            break;
            case childInst:
              pkgDef.off();
              e.stack.should.have.lengthOf(2);
              return Promise.resolve();
            // no default
          }
        });

        grandInst.tank.go(1);

        childInst.tank.stopped.should.be.false;
        childInst.tank.blocked.should.be.true;

        pkgDef.on('intercept', interceptSpy);

        // prove we're blocked
        childInst.tank.go();
        interceptSpy.should.have.been.calledOnce;

        pkgDef.off();

        return promise.then(function () {
          var beginSpy = sinon.spy(function (e) {
            e.stack.should.have.lengthOf(0);
          });

          pkgDef.on('begin', beginSpy);

          return childInst.tank.go(0);
        });
      });

    });

    describe( 'when blocked with `#block()`', function () {

      it( 'should preserve ancestry', function () {
        var
          spy = sinon.spy(),
          grandInst = pkgDef(new Klass()),
          parentInst = pkgDef(new Klass()),
          childInst = pkgInst,
          promise
        ;

        pkgDef.on('begin', function (e) {
          switch(this) {
            case grandInst:
              e.stack.should.have.lengthOf(0);
              parentInst.tank.go(1);
            break;
            case parentInst:
              e.stack.should.have.lengthOf(1);
              promise = childInst.tank.go(1);
            break;
            case childInst:
              pkgDef.off('begin');
              e.stack.should.have.lengthOf(2);
              childInst.tank.block(Promise.resolve(), true);
            break;
            // no default
          }
        });

        grandInst.tank.go(1);

        grandInst.tank.index.should.equal(1);
        parentInst.tank.index.should.equal(1);
        childInst.tank.index.should.equal(0);

        grandInst.tank.stopped.should.be.false;
        parentInst.tank.stopped.should.be.false;
        childInst.tank.stopped.should.be.false;
        childInst.tank.blocked.should.be.true;

        pkgDef
          .on('intercept', spy)
          .on('end', function (e) {
            var stack = e.stack;

            stack.should.have.lengthOf(2);
            stack[0].proxy.should.equal(parentInst.proxy);
            stack[0].type.should.equal('begin');

            stack[1].proxy.should.equal(grandInst.proxy);
            stack[1].type.should.equal('begin');
          })
        ;

        // ensures we're blocked
        childInst.tank.go();
        spy.should.have.been.calledOnce;

        return promise.then(function () {
          childInst.tank.index.should.equal(1);
          childInst.tank.stopped.should.be.false;
          spy.should.have.been.calledOnce;
        });
      });

      it( 'should clear ancestry afterwards ', function () {
        var
          interceptSpy = sinon.spy(),
          grandInst = pkgDef(new Klass()),
          parentInst = pkgDef(new Klass()),
          childInst = pkgInst,
          promise
        ;

        pkgDef.on('begin', function (e) {
          switch(this) {
            case grandInst:
              e.stack.should.have.lengthOf(0);
              parentInst.tank.go(1);
            break;
            case parentInst:
              e.stack.should.have.lengthOf(1);
              promise = childInst.tank.go(1);
            break;
            case childInst:
              pkgDef.off();
              e.stack.should.have.lengthOf(2);
              return Promise.resolve();
            // no default
          }
        });

        grandInst.tank.go(1);

        childInst.tank.stopped.should.be.false;
        childInst.tank.blocked.should.be.true;

        pkgDef.on('intercept', interceptSpy);

        // prove we're blocked
        childInst.tank.go();
        interceptSpy.should.have.been.calledOnce;

        pkgDef.off();

        return promise.then(function () {
          var beginSpy = sinon.spy(function (e) {
            e.stack.should.have.lengthOf(0);
          });

          pkgDef.on('begin', beginSpy);

          return childInst.tank.go(0);
        });
      });

    });

    describe( 'when queued', function () {

      it( 'should preserve ancestry', function () {
        var
          spy = sinon.spy(function (e) {
            var stack = e.stack;

            stack.should.have.lengthOf(2);
            stack[0].proxy.should.equal(parentInst.proxy);
            stack[0].type.should.equal(e.type);

            stack[1].proxy.should.equal(grandInst.proxy);
            stack[1].type.should.equal(e.type);
          }),
          grandInst = pkgDef(new Klass()),
          parentInst = pkgDef(new Klass()),
          childInst = pkgInst
        ;

        pkgDef.on('begin', function (e) {
          switch(this) {
            case grandInst:
              e.stack.should.have.lengthOf(0);
              parentInst.tank.go(1);
            break;
            case parentInst:
              e.stack.should.have.lengthOf(1);
              childInst.tank.go(1);
            break;
            case childInst:
              e.stack.should.have.lengthOf(2);
              childInst.tank.queue(new Klass());
            break;
            // no default
          }
        });

        grandInst.tank.go(1);

        grandInst.tank.index.should.equal(1);
        parentInst.tank.index.should.equal(1);
        childInst.tank.index.should.equal(0);

        grandInst.tank.stopped.should.be.false;
        parentInst.tank.stopped.should.be.false;
        childInst.tank.stopped.should.be.false;
        childInst.tank.queued.should.be.true;

        pkgDef
          .off()
          .on('begin', spy)
        ;

        childInst.tank.go();
        childInst.tank.index.should.equal(1);
        childInst.tank.stopped.should.be.false;
        spy.should.have.been.calledOnce;
      });

      it( 'should clear ancestry afterwards', function () {
        var
          spy = sinon.spy(function (e) {
            e.stack.should.have.lengthOf(0);
          }),
          grandInst = pkgDef(new Klass()),
          parentInst = pkgDef(new Klass()),
          childInst = pkgInst
        ;

        pkgDef.on('begin', function (e) {
          switch(this) {
            case grandInst:
              e.stack.should.have.lengthOf(0);
              parentInst.tank.go(1);
            break;
            case parentInst:
              e.stack.should.have.lengthOf(1);
              childInst.tank.go(1);
            break;
            case childInst:
              pkgDef.off();
              e.stack.should.have.lengthOf(2);
              childInst.tank.queue(new Klass());
            break;
            // no default
          }
        });

        grandInst.tank.go(1);

        childInst.tank.stopped.should.be.false;
        childInst.tank.queued.should.be.true;

        childInst.tank.go();

        childInst.tank.index.should.equal(1);
        childInst.tank.stopped.should.be.false;
        childInst.tank.queued.should.be.false;

        pkgDef.on('begin', spy);

        childInst.tank.go(0);
        spy.should.have.been.calledOnce;
      });

    });

  });

  describe( '.trail', function () {

    it( 'should be an array', function () {
      var spy = sinon.spy(function (e) {
        expect(e.trail).to.be.an('array');
      });

      pkgDef.on('begin', spy);

      tank.go();

      spy.should.have.been.called;
    });

    it( 'should be empty on first event of tank', function () {
      var spy = sinon.spy(function (e) {
        e.trail.should.have.lengthOf(0);
      });

      pkgDef.on('begin', spy);

      tank.go();

      spy.should.have.been.called;
    });

    it( 'should contain all events fired during navigation', function () {
      var trail;

      pkgDef.on('end', function (e) {
        trail = e.trail;
        e.type.should.equal('end');
      });

      tank.go(1);

      expect(trail).to.be.an('array');

      trail.map(function(crumb) {
        return crumb.type;
      }).should.eql([
        'idle',
        'release',
        'traverse',
        'traverse',
        'scope',
        'engage',
        'switch',
        'move',
        'begin'
      ]);
    });

    it( 'should order events from most recent to oldest', function () {
      var spy = sinon.spy(function (e) {
        e.trail[0].type.should.equal('end');
        e.trail[e.trail.length - 1].type.should.equal('begin');
      });

      pkgDef.on('begin', function () {
        tank.stop();
      });

      tank.go(1);
      pkgDef.off().on('begin', spy);

      tank.go();
      spy.should.have.been.called;

    });

    describe( 'when stopped', function () {

      it( 'should preserve history', function () {
        var spy = sinon.spy(function (e) {
          e.trail.length.should.be.above(0);
        });

        pkgDef
          .on('begin', function (e) {
            e.trail.should.have.lengthOf(0);
            tank.stop();
          })
          .on('end', function (e) {
            e.trail.length.should.be.above(0);
          })
        ;

        tank.go(1);

        tank.stopped.should.be.true;

        pkgDef
          .off()
          .on('begin', spy)
        ;

        tank.go();
        spy.should.have.been.calledOnce;
      });

      it( 'should clear history afterwards', function () {
        var spy = sinon.spy(function (e) {
          e.trail.length.should.equal(0);
        });

        pkgDef.on('begin', function () {
          tank.stop();
        });

        tank.go(1);

        tank.stopped.should.be.true;
        pkgDef.off();

        tank.go();

        tank.stopped.should.be.false;
        tank.target.should.equal(-1);

        pkgDef.on('begin', spy);

        tank.go();
        spy.should.have.been.calledOnce;
      });

    });

    describe( 'when blocked by a returned Promise', function () {

      it( 'should preserve history', function () {
        var
          spy = sinon.spy(function (e) {
            e.trail.length.should.be.above(0);
          }),
          promise
        ;

        pkgDef
          .on('begin', function (e) {
            pkgDef.off();
            e.trail.should.have.lengthOf(0);
            return Promise.resolve();
          })
          .on('end', function (e) {
            e.trail.length.should.be.above(0);
          })
        ;

        promise = tank.go(1);

        tank.blocked.should.be.true;

        pkgDef.on('begin', spy);

        return promise.then(function () {
          spy.should.have.been.calledOnce;
        });
      });

      it( 'should clear history afterwards', function () {
        pkgDef
          .on('begin', function (e) {
            pkgDef.off();
            e.trail.should.have.lengthOf(0);
            return Promise.resolve();
          })
          .on('end', function (e) {
            e.trail.length.should.be.above(0);
          })
        ;

        return tank.go(1).then(function () {
          var spy = sinon.spy(function (e) {
            e.trail.should.have.lengthOf(0);
          });

          pkgDef.on('begin', spy);

          tank.go(1);

          spy.should.have.been.calledOnce;
        });
      });

    });

    describe( 'when blocked with `#block()`', function () {

      it( 'should preserve history', function () {
        var
          spy = sinon.spy(function (e) {
            e.trail.length.should.be.above(0);
          }),
          promise
        ;

        pkgDef
          .on('begin', function (e) {
            pkgDef.off();
            e.trail.should.have.lengthOf(0);
            tank.block(Promise.resolve(), true);
          })
          .on('end', function (e) {
            e.trail.length.should.be.above(0);
          })
        ;

        promise = tank.go(1);

        tank.blocked.should.be.true;

        pkgDef.on('begin', spy);

        return promise.then(function () {
          spy.should.have.been.calledOnce;
        });
      });

      it( 'should clear history afterwards', function () {
        pkgDef
          .on('begin', function (e) {
            pkgDef.off();
            e.trail.should.have.lengthOf(0);
            tank.block(Promise.resolve(), true);
          })
          .on('end', function (e) {
            e.trail.length.should.be.above(0);
          })
        ;

        return tank.go(1).then(function () {
          var spy = sinon.spy(function (e) {
            e.trail.should.have.lengthOf(0);
          });

          pkgDef.on('begin', spy);

          tank.go(1);

          spy.should.have.been.calledOnce;
        });
      });

    });

    describe( 'when queued', function () {

      it( 'should preserve history', function () {
        var spy = sinon.spy(function (e) {
          e.trail.length.should.be.above(0);
        });

        pkgDef
          .on('begin', function (e) {
            e.trail.should.have.lengthOf(0);
            tank.queue(new Klass());
          })
          .on('end', function (e) {
            e.trail.length.should.be.above(0);
          })
        ;

        tank.go(1);

        tank.stopped.should.be.false;
        tank.queued.should.be.true;

        pkgDef
          .off()
          .on('begin', spy)
        ;

        tank.go();
        spy.should.have.been.calledOnce;
      });

      it( 'should clear history afterwards', function () {
        var spy = sinon.spy(function (e) {
          e.trail.length.should.equal(0);
        });

        pkgDef.on('begin', function () {
          tank.queue(new Klass());
        });

        tank.go(1);

        tank.stopped.should.be.false;
        tank.queued.should.be.true;
        pkgDef.off();

        tank.go();

        tank.stopped.should.be.false;
        tank.queued.should.be.false;
        tank.target.should.equal(-1);

        pkgDef.on('begin', spy);

        tank.go();
        spy.should.have.been.calledOnce;
      });

    });

  });

  describe( '.proxy', function () {

    it( 'should be an object property', function () {
      var spy = sinon.spy(function (e) {
        expect(e.proxy).to.be.an('object');
      });
      pkgDef.on('begin', spy);
      tank.go();
      spy.should.have.been.called;
    });

    it( 'should reference the corresponding proxy object', function () {
      var spy = sinon.spy(function (e) {
        e.proxy.should.equal(proxy);
      });
      pkgDef.on('begin', spy);
      tank.go();
      spy.should.have.been.called;
    });

  });

  describe( '.tally', function () {

    it( 'should be an object property', function () {
      var spy = sinon.spy(function (e) {
        expect(e.tally).to.be.an('object');
      });
      pkgDef.on('begin', spy);
      tank.go();
      spy.should.have.been.called;
    });

    it( 'should have members with numeric values', function () {
      var spy = sinon.spy(function (e) {
        Object.keys(e.tally).every(function (member) {
          return typeof e.tally[member] === 'number';
        }).should.be.ok;
      });
      pkgDef.on('begin', spy);
      tank.go();
      spy.should.have.been.called;
    });

    describe( '.proxy', function () {

      it( 'should reflect count of events on the public instance', function () {
        var
          lastInstanceEventCount = 0,
          spy = sinon.spy(function (e) {
            e.tally.proxy.should.be.above(lastInstanceEventCount);
            lastInstanceEventCount = e.tally.proxy;
          })
        ;

        pkgDef.on('begin',spy);

        tank.go();
        tank.go();
        tank.go();
        tank.go();

        spy.should.have.been.called;
      });

      it( 'should start with 1', function () {
        var instCount = 0;

        pkgDef.on('traverse', function (e) {
          instCount = e.tally.proxy;
          pkgDef.off();
        });

        tank.go(1);

        instCount.should.equal(1);
      });

      it( 'should increment across trips', function () {
        var lastInstance = 0;

        pkgDef.on('traverse', function (e) {
          e.tally.proxy.should.equal(lastInstance + 1);
          lastInstance = e.tally.proxy;
        });

        tank.go(1);
        tank.go(3);
        tank.go(0);

        lastInstance.should.be.above(0);
      });

    });

    describe( '.node', function () {

      it( 'should reflect count of events on a given node', function () {
        var
          watchIndex = 1,
          lastNodeEventCount = 0,
          nodeTallyTests = 0
        ;

        pkgDef.on('traverse', function (e) {
          if (e.index === watchIndex) {
            e.tally.node.should.be.above(lastNodeEventCount);
            lastNodeEventCount = e.tally.node;
            nodeTallyTests++;
          }
        });

        tank.go(2);
        tank.go(0);
        tank.go(2);
        tank.go(0);

        nodeTallyTests.should.be.above(3);
      });

      it( 'should start with 1', function () {
        var nodeCount = 0;

        pkgDef.on('traverse', function (e) {
          nodeCount = e.tally.node;
          pkgDef.off();
        });

        tank.go(1);

        nodeCount.should.equal(1);
      });

    });

    describe( '.trip', function () {

      it( 'should reflect count of events during navigation', function () {
        var tripCount = 0;

        pkgDef.on('traverse', function (e) {
          tripCount = e.tally.trip;
        });

        tank.go(1);

        tripCount.should.equal(2);
      });

      it( 'should start with 1', function () {
        var tripCount = 0;

        pkgDef.on('traverse', function (e) {
          tripCount = e.tally.trip;
          pkgDef.off();
        });

        tank.go(1);

        tripCount.should.equal(1);
      });

      it( 'should be preserved between legs of an interupted navigation', function () {
        var lastTripCount = 0;

        pkgDef.on('traverse', function (e) {
          lastTripCount = e.tally.trip;
        });

        pkgDef.on('release', function () {
          tank.stop();
        });

        tank.go(2);

        lastTripCount.should.be.above(0);
        tank.index.should.not.equal(2, 'trip was not interupted');

        pkgDef.off();

        pkgDef.on('traverse', function (e) {
          e.tally.trip.should.equal(lastTripCount + 1);
          pkgDef.off();
        });

        tank.go();

        tank.index.should.equal(2);
      });

      it( 'should reset when navigation completes', function () {
        var lastTripCount = 0;

        pkgDef.on('traverse', function (e) {
          lastTripCount = e.tally.trip;
        });

        tank.go(1);

        pkgDef.off();

        lastTripCount.should.be.above(1);
        tank.index.should.equal(1, 'trip did not complete');

        // start at top of tree again
        tank.go(0);

        pkgDef.on('traverse', function (e) {
          e.tally.trip.should.not.equal(lastTripCount + 1);
          e.tally.trip.should.equal(1);
          pkgDef.off();
        });

        tank.go(1);

        tank.index.should.equal(1);
      });

    });

    describe( '.leg', function () {

      it( 'should reflect count of events during navigation', function () {
        var legCount = 0;

        pkgDef.on('traverse', function (e) {
          legCount = e.tally.leg;
        });

        tank.go(1);

        legCount.should.equal(2);
      });

      it( 'should start with 1', function () {
        var legCount = 0;

        pkgDef.on('traverse', function (e) {
          legCount = e.tally.leg;
          pkgDef.off();
        });

        tank.go(1);

        legCount.should.equal(1);
      });

      it( 'should reset when the trip is interupted', function () {
        var
          spy = sinon.spy(function (e) {
            e.tally.leg.should.equal(1);
            pkgDef.off();
          }),
          lastLegCount = 0
        ;

        pkgDef.on('traverse', function (e) {
          lastLegCount = e.tally.leg;
        });

        pkgDef.on('release', function () {
          tank.stop();
        });

        tank.go(2);

        lastLegCount.should.be.above(0);
        tank.index.should.not.equal(2, 'trip was not interupted');

        pkgDef.off();

        pkgDef.on('traverse', spy);

        tank.go();

        tank.index.should.equal(2);
        spy.should.have.been.called;
      });

    });

  });

});