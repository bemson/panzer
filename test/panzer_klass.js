describe( 'Klass', function () {

  var Klass;

  beforeEach(function () {
    Klass = Panzer.create();
  });

  it( 'should only be called as a constructor', function () {
    expect(function () {Klass()}).to.throw();
    expect(function () {new Klass()}).to.not.throw();
  });

  it( 'should return an instance', function () {
    var proxy = new Klass();
    proxy.should.be.an.instanceOf(Klass);
  });

  it( 'should allow/expect two arguments', function () {
    Klass.should.have.lengthOf(2);
  });

  describe( '::pkg()', function () {

    it( 'should resolve or register a package by alphanumeric id', function () {
      var
        pkg = Klass.pkg('a'),
        spy
      ;

      pkg.should.be.a('function')
        .and.equal(Klass.pkg('a'));

      spy = sinon.spy(Klass, 'pkg');
      [null, true, false, undefined, 1, 0, function () {}, [], {}, '!@#'].forEach(function (arg) {
        Klass.pkg(arg);
      });
      spy.should.have.always.returned(false);
    });

    it( 'should list registered package ids', function () {
      Klass.pkg('a');
      Klass.pkg('b');
      Klass.pkg()
        .should.be.an.instanceOf(Array)
        .and.deep.equal(['a','b']);
    });

  });

});