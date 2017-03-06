describe( 'Panzer', function () {

  it( 'should be an object', function () {
    Panzer.should.be.an('object');
  });

  describe( '::version', function () {

    it( 'should be a static string ', function () {
      Panzer.should.have.ownProperty('version');
      Panzer.version.should.be.a('string');
    });

    it( 'should be semver compliant', function () {
      Panzer.version.should.match(/^\d+\.\d+\.\d+$/);
    });

  });

  describe( '::create()', function () {

    it( 'should be static method', function () {
      Panzer.should.itself.respondTo('create');
    });

    it( 'should expect zero arguments', function () {
      Panzer.create.should.have.lengthOf(0);
    });

    it( 'should return a unique Klass (constructor function)', function() {
      Panzer.create().should.be.a('function');
      Panzer.create().should.not.equal(Panzer.create());
    });

  });

});