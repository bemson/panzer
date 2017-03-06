describe( 'Klass', function () {

  var Klass;

  beforeEach(function () {
    Klass = Panzer.create();
  });

  describe( 'constructor', function () {

    it( 'should be a function', function () {
      Klass.should.be.a('function');
    });

    it( 'should accept two arguments', function () {
      Klass.should.have.lengthOf(2);
    });

    it( 'should not throw when either argument is omitted or any value', function () {
      expect(function () {
        new Klass();
      }).to.not.throw;

      [[], {}, '', 'a', 0, 1, -1, null, undefined].forEach(function () {
        expect(function (val) {
          new Klass(val, val);
        }).to.not.throw;
      });
    });

    describe( 'when the', function () {

      var pkgDef;

      beforeEach(function () {
        pkgDef = Klass.pkg('a');
      });

      describe( 'first argument is a recursive object', function () {

        it( 'should parse indefinitely', function () {
          var
            count = 0,
            minCalls = 50,
            scalarValue = 1,
            recursiveValue = {},
            spy = sinon.spy(function (name, value) {
              return count++ > minCalls ? scalarValue : value;
            })
          ;

          recursiveValue.a = recursiveValue;

          pkgDef.prepNode = spy;

          proxy = new Klass(recursiveValue);
          spy.callCount.should.be.above(minCalls);
        });

      });

      describe( 'second argument is', function () {

        describe( 'null or undefined', function () {

          it( 'should result in an empty config object', function () {
            var
              spy = sinon.spy(function (evt, config) {
                expect(config)
                  .to.be.an('object')
                  .and.empty;
              })
            ;

            pkgDef.on('init', spy);

            new Klass({}, null);
            spy.should.have.been.calledOnce;

            new Klass({}, undefined);
            spy.should.have.been.calledTwice;
          });

        });

        describe( 'any other value', function () {

          it( 'should pass-thru as the config value', function () {

            var
              vals = ['', 0, 1, -1, 'a', {}, []],
              idx,
              spy = sinon.spy(function (evt, config) {
                expect(config).to.equal(vals[idx]);
              })
            ;

            pkgDef.on('init', spy);

            vals.forEach(function (val, i) {
              idx = i;
              new Klass(1, val);
            });

            spy.callCount.should.equal(vals.length);
          });

        });

      });

    });


    describe( 'with `new`', function () {

      it( 'should return an instance (aka "proxy")', function () {
        var proxy = new Klass();
        proxy.should.be.an.instanceOf(Klass);
      });

    });

    describe( 'without `new`', function () {

      it( 'should return a promise', function () {
        expect(Klass()).to.be.an.instanceOf(Promise);
      });

      it( 'should resolve with the proxy', function () {
        return Klass().then(function (proxy) {
          expect(proxy).to.be.an.instanceOf(Klass);
        });
      });

    });

  });

  describe( '::id', function () {

    it( 'should be a static member', function () {
      Klass.should.have.ownProperty('id');
    });

    it( 'should be a number', function () {
      Klass.id.should.a('number');
    });

    it( 'should increment per Klass', function () {
      Panzer.create().id.should.equal(Klass.id + 1);
    });

  });

  describe( '::pkg()', function () {

    it( 'should be a static member', function () {
      Klass.should.have.ownProperty('pkg');
    });

    it( 'should be a function that accepts one argument', function () {
      Klass.pkg.should.be.a('function');
      Klass.pkg.length.should.equal(1);
    });

    describe('when passed an alphanumeric string', function () {

      it( 'should return a package definition function', function () {

        ['foo', '  f  ', '4'].forEach(function (pkgName) {
          Klass.pkg(pkgName).should.be.a('function',
            'failed to return a package with "' + pkgName + '"');
        });

      });

      it( 'should return the same package for the same string', function () {
        var pkgName = 'foo';
        Klass.pkg(pkgName).should.equal(Klass.pkg(pkgName));
      });

      it( 'should return a different package based on white space', function () {
        var pkgName = 'foo';
        Klass.pkg(pkgName).should.not.equal(Klass.pkg(' ' + pkgName));
      });

    });

    describe( 'when passed nothing', function () {

      it( 'should return a new array', function () {

        Klass.pkg()
          .should.be.instanceOf(Array)
          .and.not.equal(Klass.pkg(),
            'returns the same array with nothing');

      });

      it( 'should return an empty array initially', function () {
        Klass.pkg().should.be.empty;
      });

      it( 'should return an array of package names in creation order', function () {
        var order = ['a', 'b', 'c'];

        Klass.pkg('a');
        Klass.pkg('b');
        Klass.pkg('c');

        Klass.pkg().should.eql(order);
      });

    });

    describe( 'when passed anything except an alphanumeric string', function () {

      it( 'should throw', function () {
        [undefined, null, function () {}, new Klass(), '', '>', 2, {}, [], '!', /foo/].forEach(function (arg) {
          expect(function () {
            Klass.pkg(arg)
          }).to.throw;
        });

      });

    });

  });

});