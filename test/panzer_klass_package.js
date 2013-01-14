describe( 'Package', function () {

  var
    Klass,
    pkgDef
  ;

  before(function () {
    Klass = Panzer.create();
    pkgDef = Klass.pkg('a');
  });

  it( 'should retrieve a corresponding package instance when passed a proxy', function () {
    pkgDef(new Klass()).should.be.an.instanceOf(pkgDef);
  });

  it( 'should falsy return value (otherwise)', function () {
    [null, true, false, 0, 1, {}, [], function () {}, undefined, '', 'abc', '!@#']
      .forEach(function (arg) {
        expect(pkgDef(arg)).to.not.be.ok;
      });
  });

  it( 'should return an empty instances when used as a constructor', function () {
   [null, true, false, 0, 1, {}, [], function () {}, undefined, '', 'abc', '!@#']
      .forEach(function (arg) {
        expect(new pkgDef(arg)).to.be.empty;
      });
     expect(new pkgDef()).to.be.empty;    
  })

});