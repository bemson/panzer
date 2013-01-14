describe( 'Panzer', function () {

  it( 'should be a versioned namespace', function () {
    Panzer.should.be.an('object');
    Panzer.version
      .should.be.a('string')
      .and.match(/^\d+\.\d+\.\d+$/);
  });

  describe( '.create()', function () {

    it( 'should return a Klass', function() {
      Panzer.create()
        .should.be.a('function')
        .and.itself.respondTo('pkg')
    });

  });

});