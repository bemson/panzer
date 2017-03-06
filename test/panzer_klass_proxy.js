describe( 'Proxy (Klass instance)', function () {

  var Klass, proxy;

  beforeEach(function () {
    Klass = Panzer.create();
    proxy = new Klass();
  });

  it( 'should have a local `.ready` property', function () {
    proxy.should.have.ownProperty('ready');
  });

  describe( '.ready', function () {

    it( 'should be a thenable', function () {
      // proxy.ready.should.be.an('object');
      proxy.ready.should.have.property('then');
      proxy.ready.then.should.be.a('function');
    });

    it( 'should resolve with the same proxy instance', function () {
      var thenable = proxy.ready;

      return proxy.ready.then(function (p) {
        expect(p).to.equal(proxy);
        p.ready.should.equal(thenable);
      });
    });

    it( 'should be the same thenable when invoking Klass without `new`', function () {
      var thenable = Klass();

      return thenable.then(function (p) {
        p.ready.should.equal(thenable);
      });
    });

  });

  describe( 'without packages', function () {

    it( 'should have no inherited members', function () {
      var
        inherited = 0,
        key
      ;

      for (key in proxy) {
        if (!proxy.hasOwnProperty(key)) {
          inherited++;
        }
      }

      inherited.should.equal(0);
    });

    it( 'should have an inherited `#toString()` method', function () {
      proxy.should.not.have.ownProperty('toString');
    });

  });

  describe( 'with packages', function () {

    beforeEach(function () {
      Klass.pkg('foo');
      Klass.pkg('bar');

      proxy = new Klass();
    });

    describe( '#toString()', function () {

      it( 'should be a local method', function () {
        proxy.should.have.ownProperty('toString');
        proxy.should.itself.respondTo('toString');
      });

      it( 'should behave like `Object#toString()`', function () {
        proxy.toString().should.equal(({}).toString());
        proxy.toString(12).should.equal(({}).toString(12));
      });

    });

  });
});