describe( 'Package events', function () {

  var
    Klass,
    pkgDef,
    pkgInst,
    eventNames = [
      'begin', 'end', 'engage', 'node', 'release',
      'scope', 'traverse', 'traversed', 'traversing'
    ],
    stuffObj = [],
    stuff = {
      'a':1,
      'a2':'foo',
      'c': stuffObj
    }
  ;

  beforeEach(function () {
    Klass = Panzer.create();
    pkgDef = Klass.pkg('a');
    pkgInst = pkgDef(new Klass(stuff));
  });

  it( 'should scope callbacks to their package-instance', function () {
    var hdlrs = {};

    eventNames.forEach(function (eventName) {
      if (eventName != 'traverse') {
        pkgDef.on(eventName, hdlrs[eventName] = sinon.spy());
      }
    });

    pkgDef.on('traverse', hdlrs.traverse = sinon.spy(function () {
      this.tank.stop();
    }));

    pkgInst.tank.go(1);
    pkgInst.tank.go(1);

    eventNames.forEach(function (eventName) {
      hdlrs[eventName].should.have.always.been.calledOn(pkgInst);
    });
  });

  it( 'should occur in the expected order', function () {
    var
      order = [],
      pkgInst = pkgDef(new Klass())
    ;

    setUpTraces();

    pkgInst.tank.go(1);

    // validate simple traversal
    order.should.eql([1,2,3,4,5,7,5,7,8,9]);
    order = [];
    pkgInst.tank.currentIndex.should.equal(1);

    pkgDef.on('traverse', function () {
      this.tank.stop();
    });
    pkgInst.tank.go(1);

    // validate interrupting navigation
    order.should.eql([1,3,5,8,9]);
    order = [];

    setUpTraces();

    pkgDef
      .off('traverse')
      .on('traverse', trace(5))
    ;
    pkgInst.tank.go(1);
    // validate resuming navigation
    order.should.eql([1,3,6,7,5,7,8,9]);

    // test stopping from each event
    [
      ['begin', [1,9]],
      ['end', [1,2,3,4,5,7,5,7,8,9]],
      ['engage', [1,2,3,8,9]],
      ['node', [1,2,9]],
      ['release', [1,2,3,4,5,7,5,7,8,9]],
      ['scope', [1,2,3,4,8,9]],
      ['traverse', [1,2,3,4,5,8,9]],
      ['traversed', [1,2,3,4,5,7,8,9]]
    ].forEach(function (seq) {
      var
        eventName = seq[0],
        expectedOrder = seq[1]
      ;
      pkgInst.tank.go(0);
      order = [];

      pkgDef.on(eventName, stopper);

      pkgInst.tank.go(1);

      order.should.eql(expectedOrder);

      pkgDef.off(eventName, stopper);

      function stopper() {
        this.tank.stop();
      }

    });

    function trace(n) {
      return function () {
        order.push(n);
      };
    }

    function setUpTraces() {
      pkgDef
        .off()
        .on('begin', trace(1))
        .on('node', trace(2))
        .on('engage', trace(3))
        .on('scope', trace(4))
        .on('traverse', trace(5))
        .on('traversing', trace(6))
        .on('traversed', trace(7))
        .on('release', trace(8))
        .on('end', trace(9))
      ;
    }
  });

  it( 'should pass the event name as the first callback argument', function () {
    var hdlrs = {};
    eventNames.forEach(function (eventName) {
      pkgDef.on(eventName, hdlrs[eventName] = sinon.spy());
    });
    pkgDef
      .off('traverse')
      .on('traverse', hdlrs.traverse = sinon.spy(function () {
        this.tank.stop();
      }))
    ;
    pkgInst.tank.go(1);
    pkgInst.tank.go(1);
    eventNames.forEach(function (eventName) {
      hdlrs[eventName].firstCall.args[0].should.equal(eventName);
    });
   });

  describe( 'begin & end', function () {

    it( 'should trigger when tank.go() is called (outside of a loop)', function () {
      var hdlrs = {};
      pkgDef.on('begin', hdlrs.begin = sinon.spy());
      pkgDef.on('end', hdlrs.end = sinon.spy());
      pkgInst.tank.go();
      hdlrs.begin.should.have.been.calledOnce;
      hdlrs.end.should.have.been.calledOnce;
    });

  });

  describe( 'node', function () {

    it( 'should include indexes for the current and old node', function () {
      var cb = sinon.spy();

      pkgDef.on('node', cb);
      pkgInst.tank.go(1);

      cb.should.have.been.calledOnce;
      cb.firstCall.args.should.have.length(3);
      cb.firstCall.args[1].should.equal(1);
      cb.firstCall.args[2].should.equal(0);

    });

  });

  describe( 'release & engage', function () {

    it( 'should wrap scope and traversal events', function () {
      var
        hdlrs = {},
        EventsBetweenReleaseAndEngage = eventNames.slice(5)
      ;

      eventNames.slice(2).forEach(function (eventName) {
        pkgDef.on(eventName, hdlrs[eventName] = sinon.spy());
      });
      pkgDef.on('node', function () {
        if (hdlrs.engage.callCount) {
          EventsBetweenReleaseAndEngage.forEach(function (eventName) {
            if (hdlrs[eventName].called) {
              hdlrs.engage.should.have.been.calledBefore(hdlrs[eventName]);
              hdlrs.release.should.have.been.calledAfter(hdlrs[eventName]);
            }
          });
          eventNames.slice(2).forEach(function (eventName) {
            if (eventName != 'node') {
              hdlrs[eventName].reset();
            }
          });
        }
      });
      pkgInst.tank.go(5);
    });

  });

  describe( 'scope', function () {

    it( 'should indicate entry or exit with a second argument', function () {
      var hdlr = sinon.spy();

      pkgDef.on('scope', hdlr);

      pkgInst.tank.go(1);
      pkgInst.tank.go(0);

      hdlr.should.have.been.calledTwice;
      hdlr.firstCall.args[1].should.have.been.ok;
      hdlr.secondCall.args[1].should.not.have.been.ok;
    });

  });

  describe( 'traversed', function () {

    it( 'should not occur if stopped during traverse/traversing', function () {
      var hdlr = sinon.spy();

      pkgDef.on('traversed', hdlr);

      pkgInst.tank.go(0);
      hdlr.should.have.been.calledOnce;
      hdlr.reset();

      pkgDef.on('traverse', function () {
        this.tank.stop();
      });

      pkgInst.tank.go(0);
      hdlr.should.not.have.been.called;

    });

  });

  describe( 'traversing', function () {

    function stopper() {
      this.tank.stop();
    }

    it( 'should expect two arguments', function () {
      var hdlr = sinon.spy();

      pkgDef
        .on('traverse', stopper)
        .on('traversing', hdlr)
      ;
      pkgInst.tank.go(1);
      pkgInst.tank.go(0);

      hdlr.should.have.been.calledOnce;
      hdlr.firstCall.args.should.have.length(2);
    });

    it( 'should be passed a number as the second argument', function () {
      var hdlr = sinon.spy();


      pkgDef
        .on('traverse', stopper)
        .on('traversing', hdlr)
      ;

      pkgInst.tank.go(1);
      pkgInst.tank.go(0);
      hdlr.should.have.been.calledOnce;
      expect(hdlr.firstCall.args[1]).to.be.a.number;
    });

    it( 'should occur when traverse stops navigation', function () {
      var
        traverse = sinon.spy(),
        traversing = sinon.spy(),
        traversed = sinon.spy(),
        tank = pkgInst.tank
      ;

      pkgDef
        .on('traverse', stopper)
        .on('traverse', traverse)
        .on('traversing', traversing)
        .on('traversed', traversed)
      ;

      // confirm we're not done
      tank.targetIndex.should.equal(-1);

      // start navigation
      tank.go(1);

      // confirm we've stopped
      tank.targetIndex.should.not.equal(-1);
      traverse.should.have.been.calledOnce;
      traversed.should.not.have.been.called;
      traversing.should.not.have.been.called;

      traverse.reset();

      // resume navigation
      tank.go();

      // confirm we're done navigating
      tank.targetIndex.should.equal(-1);
      traverse.should.have.been.called;
      traversed.should.have.been.calledOnce;
      traversing.should.have.been.calledOnce;
      traversing.should.have.been.calledBefore(traverse);
      traversing.should.have.been.calledBefore(traversed);
    });

    // stopping on -ed events yet to be implemented
    it( 'should occur when traversed stops navigation', function () {
      var
        traverse = sinon.spy(),
        traversing = sinon.spy(),
        traversed = sinon.spy(),
        tank = pkgInst.tank
      ;

      pkgDef
        .on('traverse', traverse)
        .on('traversing', traversing)
        .on('traversed', stopper)
        .on('traversed', traversed)
      ;

      // confirm we're not done
      tank.targetIndex.should.equal(-1);

      // start navigation
      tank.go(1);

      // confirm we've stopped
      tank.targetIndex.should.not.equal(-1);
      traverse.should.have.been.calledOnce;
      traversed.should.have.been.calledOnce;
      traversing.should.not.have.been.called;

      traverse.reset();
      traversed.reset();
      pkgDef.off('traversed', stopper);

      // resume navigation
      tank.go();

      // confirm we're done navigating
      tank.targetIndex.should.equal(-1);
      traverse.should.have.been.called;
      traversed.should.have.been.called;
      traversing.should.have.been.calledOnce;
      traversing.should.have.been.calledBefore(traverse);
      traversing.should.have.been.calledBefore(traversed);
    });

    it( 'should occur indefinitely when traversing stops navigation', function () {
      var
        total = 50,
        iter = total,
        traverse = sinon.spy(),
        traversing = sinon.spy(),
        traversed = sinon.spy(),
        tank = pkgInst.tank
      ;

      pkgDef
        .on('traverse', traverse)
        .on('traverse', stopper)
        .on('traversing', stopper)
        .on('traversing', traversing)
        .on('traversed', traversed)
      ;

      // confirm we're not done
      tank.targetIndex.should.equal(-1);

      // start navigation
      tank.go(1);

      // confirm we've stopped
      tank.targetIndex.should.not.equal(-1);
      traverse.should.have.been.calledOnce;
      traversed.should.not.have.been.called;
      traversing.should.not.have.been.called;

      traverse.reset();

      // ensure traversing fires over and over
      while (iter--) {
        // resume navigation - once
        tank.go();

        // confirm we're not done
        tank.targetIndex.should.not.equal(-1);
        traverse.should.not.have.been.called;
        traversed.should.not.have.been.called;
        traversing.callCount.should.equal(total - iter);
      }

    });

    it( 'should occur on the previous node/phase before resuming navigation', function () {
      var
        curNode = -1,
        traverse = sinon.spy(),
        traversing = sinon.spy()
      ;

      pkgDef.on('traversing',  function () {
        curNode = this.tank.currentIndex;
      });
      pkgDef
        .on('traversing', traversing)
        .on('traverse', traverse)
        .on('traverse', function () {
          this.tank.stop();
        });

      pkgInst.tank.go(3);
      pkgInst.nodes.should.have.length(5);
      traversing.should.not.have.been.called;

      pkgInst.tank.go(3);
      traversing.should.have.been.calledOnce;
      traverse.firstCall.args[1]
        .should.equal(traversing.firstCall.args[1]);

      curNode.should.equal(1);
    });

    it( 'should occur with the same node and phase as the previous "traverse"', function () {
      var
        curNode = -1,
        phases = []
      ;

      pkgDef
        .on('traversing', function (evt, phase) {
          phases.push([this.tank.currentIndex, phase]);
        })
        .on('traverse', function (evt, phase) {
          this.tank.stop();
          phases.push([this.tank.currentIndex, phase]);
        })
      ;

      pkgInst.tank.go(1);
      pkgInst.tank.go(0);

      phases.should.have.length.above(1);
      expect(phases[0][1]).to.equal(phases[1][1]);
    });

  });

  describe( 'traverse', function () {

    var spy;

    beforeEach(function () {
      spy = sinon.spy();

      pkgDef
        .off()
        .on('traverse', spy)
        .on('traversed',  spy)
      ;
    });

    it( 'should pass 0 when on a node', function () {
      pkgInst.tank.go(0);
      spy.calledWith(0);
    });

    it( 'should pass 1 when entering a node', function () {
      pkgInst.tank.go(1);
      spy.calledWith(1);
    });

    it( 'should pass 2 when exiting a node', function () {
      pkgInst.tank.go(1);
      pkgInst.tank.go(0);
      spy.calledWith(2);
    });

    it( 'should pass 3 when bypassing a node, down the tree', function () {
      pkgInst.tank.go(3);
      spy.calledWith(3);
    });

    it( 'should pass 4 when bypassing a node, up the tree', function () {
      pkgInst.tank.go(3);
      pkgInst.tank.go(2);
      spy.calledWith(5);
    });

  });

  // describe( 'stopping and resuming', function () {

  //   it( 'should resume when on a node', function () {
  //     var
  //       traverse = sinon.spy(function (eventName, traversalPhase) {
  //         if (traversalPhase === 0) {
  //           this.tank.stop();
  //         }
  //       }),
  //       traversed = sinon.spy()
  //     ;

  //     pkgDef
  //       .on('traverse', traverse)
  //       .on('traversed',  traversed)
  //     ;
  //     pkgInst.tank.go(0);

  //     traverse.should.have.been.calledOnce;
  //     traverse.reset();
  //     traversed.should.not.have.been.calledOnce;

  //     pkgDef.on('traversed', function () {
  //       this.tank.stop();
  //     });

  //     pkgInst.tank.go();

  //     traverse.should.not.have.been.called;
  //     traversed.should.have.been.calledOnce;
  //     pkgDef
  //       .off('traversed')
  //       .on('traversed', traversed)
  //     ;
  //     pkgInst.tank.go();
  //     traversed.should.have.been.calledOnce;
  //   });

  //   it( 'should resume when entering a node', function () {
  //     var
  //       traverse = sinon.spy(function (eventName, traversalPhase) {
  //         if (traversalPhase === 1) {
  //           this.tank.stop();
  //         }
  //       }),
  //       traversed = sinon.spy()
  //     ;

  //     pkgDef
  //       .on('traverse', traverse)
  //       .on('traversed',  traversed)
  //     ;

  //     pkgInst.tank.go(1);
  //     traverse.should.have.been.calledOnce;

  //     traverse = sinon.spy();
  //     pkgDef.off('traverse').on('traverse', traverse);

  //     pkgDef.on('traversed', .should.not.have.been.called;

  //     pkgDef.on('traversed',  = sinon.spy(function () {
  //       this.tank.stop();
  //     });
  //     pkgInst.tank.go();
  //     pkgDef.on('traverse', .should.not.have.been.called;
  //     pkgDef.on('traversed', .should.have.been.calledOnce;
  //     pkgDef.on('traversed',  = sinon.spy();
  //     pkgInst.tank.go();
  //     pkgDef.on('traverse', .should.have.been.calledOnce;
  //     pkgDef.on('traversed', .should.have.been.calledTwice;
  //   });

  //   it( 'should resume when exiting a node', function () {
  //     pkgInst.tank.go(1);
  //     pkgDef.on('traverse',  = sinon.spy(function (eventName, traversalPhase) {
  //       if (traversalPhase === 2) {
  //         this.tank.stop();
  //       }
  //     });
  //     pkgDef.on('traversed',  = sinon.spy();
  //     pkgInst.tank.go(0);
  //     pkgDef.on('traverse', .should.have.been.calledOnce;
  //     pkgDef.on('traverse',  = sinon.spy();
  //     pkgDef.on('traversed', .should.not.have.been.called;

  //     pkgDef.on('traversed',  = sinon.spy(function () {
  //       this.tank.stop();
  //     });
  //     pkgInst.tank.go();
  //     pkgDef.on('traverse', .should.not.have.been.called;
  //     pkgDef.on('traversed', .should.have.been.calledOnce;
  //     pkgDef.on('traversed',  = sinon.spy();
  //     pkgInst.tank.go();
  //     pkgDef.on('traverse', .should.have.been.calledOnce;
  //     pkgDef.on('traversed', .should.have.been.calledTwice;
  //   });

  //   it( 'should resume when bypassing a node, down the tree', function () {
  //     pkgInst.tank.go(1);
  //     pkgDef.on('traverse',  = sinon.spy(function (eventName, traversalPhase) {
  //       if (traversalPhase === 3) {
  //         this.tank.stop();
  //       }
  //     });
  //     pkgDef.on('traversed',  = sinon.spy();
  //     pkgInst.tank.go(3);
  //     pkgDef.on('traverse', .should.have.been.calledOnce;
  //     pkgDef.on('traverse',  = sinon.spy();
  //     pkgDef.on('traversed', .should.not.have.been.called;

  //     pkgDef.on('traversed',  = sinon.spy(function () {
  //       this.tank.stop();
  //     });
  //     pkgInst.tank.go();
  //     pkgDef.on('traverse', .should.not.have.been.called;
  //     pkgDef.on('traversed', .should.have.been.calledOnce;
  //     pkgDef.on('traversed',  = sinon.spy();
  //     pkgInst.tank.go();
  //     pkgDef.on('traverse', .should.have.been.calledTwice;
  //     pkgDef.on('traversed', .should.have.been.calledThrice;
  //   });

  //   it( 'should resume when bypassing a node, up the tree', function () {
  //     pkgInst.tank.go(3);
  //     pkgDef.on('traverse',  = sinon.spy(function (eventName, traversalPhase) {
  //       if (traversalPhase === 4) {
  //         this.tank.stop();
  //       }
  //     });
  //     pkgDef.on('traversed',  = sinon.spy();
  //     pkgInst.tank.go(1);
  //     pkgDef.on('traverse', .should.have.been.calledTwice;
  //     pkgDef.on('traverse',  = sinon.spy();
  //     pkgDef.on('traversed', .should.have.been.calledOnce;

  //     pkgDef.on('traversed',  = sinon.spy(function () {
  //       this.tank.stop();
  //     });
  //     pkgInst.tank.go();
  //     pkgDef.on('traverse', .should.not.have.been.called;
  //     pkgDef.on('traversed', .should.have.been.calledOnce;
  //     pkgDef.on('traversed',  = sinon.spy();
  //     pkgInst.tank.go();
  //     pkgDef.on('traverse', .should.have.been.calledOnce;
  //     pkgDef.on('traversed', .should.have.been.calledTwice;
  //   });

  // });

  describe( 'navigation', function () {

    it( 'should allow stopping towards parent and redirecting to older sibling', function () {
      var
        traversing,
        phases = []
      ;

      pkgInst.tank.go(2);
      pkgDef.on('traverse', function (evt, phase) {
        expect(phase).to.equal(2);
        this.tank.currentIndex.should.equal(2);
        this.tank.stop();
      });
      pkgInst.tank.currentIndex.should.equal(2);
      pkgInst.tank.go(0);
      pkgInst.tank.currentIndex.should.equal(2);

      pkgDef.on('traversing', traversing = sinon.spy(function (evt, phase) {
        this.tank.currentIndex.should.equal(2);
      }));
      pkgDef
        .off('traverse')
        .on('traverse', function (evt, phase) {
          phases.push([this.tank.currentIndex, phase]);
        })
      ;

      pkgInst.tank.go(3);
      traversing.should.have.been.calledOnce;
      pkgInst.tank.currentIndex.should.equal(3);
      phases.should.eql([[3,1], [3,0]]);
    });

  });

});