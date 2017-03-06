describe( 'Package node', function () {

  var
    Klass,
    proxy,
    pkgDef,
    pkgInst,
    source,
    nodes
  ;

  beforeEach(function () {
    source = {a:{b:1,c:4},d:{f:8,g:{h:3,k:9}}};
    Klass = Panzer.create();
    pkgDef = Klass.pkg('a');
    proxy = new Klass(source);
    pkgInst = pkgDef(proxy);
    nodes = pkgInst.nodes;
  });

  it( 'should be an object', function () {
    nodes.forEach(function (node) {
      expect(node).to.be.an('object');
    });
  });

  describe( 'at index 0', function () {

    var node;

    beforeEach(function () {
      node = nodes[0];
    });

    it( 'should have an `undefined` .value', function () {
      expect(node.value).to.be.undefined;
    });

    it( 'should be named "PNULL"', function () {
      nodes[0].name.should.equal('PNULL');
    });

    it( 'should have `.path` of "..//"', function () {
      nodes[0].path.should.equal('..//');
    });

    it( 'should have `.depth` of 0', function () {
      node.depth.should.equal(0);
    });

    it( 'should have `.parentIndex`, `.nextIndex` and `.previousIndex` of -1', function () {
      node.parentIndex.should.equal(-1);
      node.nextIndex.should.equal(-1);
      node.previousIndex.should.equal(-1);
    });

    it( 'should have empty `.attrs` object property', function () {
      node.attrs
        .should.be.an('object')
        .and.empty;
    });

  });

  describe( 'at index 1', function () {

    var node;

    beforeEach(function () {
      node = nodes[1];
    });

    it( 'should match the raw tree as it\'s .value', function () {
      expect(node.value).to.equal(source);
    });

    it( 'should be named "PROOT"', function () {
      node.name.should.equal('PROOT');
    });

    it( 'should have `.path` of "//"', function () {
      node.path.should.equal('//');
    });

    it( 'should have `.depth` of 1', function () {
      node.depth.should.equal(1);
    });

    it( 'should have `.parentIndex` of 0', function () {
      node.parentIndex.should.equal(0);
    });

    it( 'should have `.nextIndex` and `.previousIndex` of -1', function () {
      node.nextIndex.should.equal(-1);
      node.previousIndex.should.equal(-1);
    });

    it( 'should have empty `.attrs` object property', function () {
      node.attrs
        .should.be.an('object')
        .and.empty;
    });

  });

  describe( 'member', function () {

    var allPkgNodes;

    beforeEach(function () {
      allPkgNodes = nodes;
      nodes = nodes.slice(2);
    });

    describe( '.name', function () {

      var json;

      beforeEach(function () {
        json = JSON.stringify(source);
      });

      it( 'should be a string property', function () {
        nodes.forEach(function (node) {
          node.path
            .should.be.a('string')
            .and.length.above(0);
        });
      });

      it( 'should match keys of the source object', function () {
        nodes.forEach(function (node) {
          json.indexOf('"' + node.name + '"').should.not.equal(-1);
        });
      });

    });

    describe( '.value', function () {

      var values;

      function getValues(obj) {
        Object.keys(obj).forEach(function (key) {
          var value = obj[key];
          values.push(value);
          if (value && typeof value === 'object') {
            getValues(value);
          }
        });
      }

      beforeEach(function () {
        values = [];
        getValues(source);
      });

      it( 'should be a local key', function () {
        nodes.forEach(function (node) {
          node.should.have.ownProperty('value');
        });
      });

      it( 'should match values from the source object', function () {
        nodes.forEach(function (node) {
          values.indexOf(node.value).should.not.equal(-1);
        });
      });

    });

    describe( '.path', function () {

      it( 'should be a string property', function () {
        nodes.forEach(function (node) {
          node.path
            .should.be.a('string')
            .and.length.above(0);
        });
      });

    });

    describe( '.attrs', function () {

      it( 'should be an object property', function () {
        nodes.forEach(function (node) {
          node.attrs.should.be.an('object');
        });
      });

      it( 'should have attributes designated by `pkg::attrKey`');

    });

    describe( '.index', function () {

      it( 'should be a numeric property', function () {
        nodes.forEach(function (node) {
          node.index.should.be.a('number');
        });
      });

      it( 'should match the node\'s position in the `.nodes` array', function () {
        nodes.forEach(function (node) {
          node.should.equal(allPkgNodes[node.index]);
        });
      });

    });

    describe( '.depth', function () {

      it( 'should be a numeric property', function () {
        nodes.forEach(function (node) {
          node.depth.should.be.a('number');
        });
      });

      it( 'should be greater than 1', function () {
        nodes.forEach(function (node) {
          node.depth.should.be.above(1);
        });
      });

    });

    describe( '.parentIndex', function () {

      it( 'should be a numeric property', function () {
        nodes.forEach(function (node) {
          node.parentIndex.should.be.a('number');
        });
      });

      it( 'should be the index of a node that points to this one in their `.children` array', function () {
        nodes.forEach(function (node) {
          var otherNode = allPkgNodes[node.parentIndex];
          expect(otherNode).to.be.an('object');
          otherNode.children.indexOf(node.index).should.not.equal(-1);
        });
      });


      it( 'should be 1 or greater', function () {
        nodes.forEach(function (node) {
          node.parentIndex.should.be.above(0);
        });
      });

    });

    describe( '.previousIndex', function () {

      it( 'should be a numeric property', function () {
        nodes.forEach(function (node) {
          node.previousIndex.should.be.a('number');
        });
      });

      describe( 'with a previous sibling', function () {

        var group;

        beforeEach(function () {
          group = nodes.filter(function (node) {
            return node.previousIndex !== -1;
          });
        });

        it( 'should be the index of a node that points to this one via their `.nextIndex`', function () {
          group.forEach(function (node) {
            var otherNode = allPkgNodes[node.previousIndex];
            expect(otherNode).to.be.an('object');
            otherNode.nextIndex.should.equal(node.index);
          });
        });

      });


      describe( 'without a previous sibling', function () {

        var group;

        beforeEach(function () {
          group = nodes.filter(function (node) {
            return node.previousIndex === -1;
          });
        });

        it( 'should be -1', function () {
          nodes[0].previousIndex.should.equal(-1);
        });

      });

    });

    describe( '.nextIndex', function () {

      it( 'should be a numeric property', function () {
        nodes.forEach(function (node) {
          node.nextIndex.should.be.a('number');
        });
      });

      describe( 'with a next sibling', function () {

        var group;

        beforeEach(function () {
          group = nodes.filter(function (node) {
            return node.nextIndex !== -1;
          });
        });

        it( 'should be the index of a node that points to this one via their `.previousIndex`', function () {
          group.forEach(function (node) {
            var otherNode = allPkgNodes[node.nextIndex];
            expect(otherNode).to.be.an('object');
            otherNode.previousIndex.should.equal(node.index);
          });
        });

      });

      describe( 'with a next sibling', function () {

        var group;

        beforeEach(function () {
          group = nodes.filter(function (node) {
            return node.nextIndex === -1;
          });
        });

        it( 'should be -1', function () {
          group.forEach(function (node) {
            node.nextIndex.should.equal(-1);
          });
        });

      });

    });

    describe( '.firstChildIndex', function () {

      it( 'should be a numeric property', function () {
        nodes.forEach(function (node) {
          node.firstChildIndex.should.be.a('number');
        });
      });

      describe( 'with children', function () {

        var group;

        beforeEach(function () {
          group = nodes.filter(function (node) {
            return node.children.length;
          });
        });

        it( 'should be the index of a node that points to this one via their `.parentIndex`', function () {
          group.forEach(function (node) {
            var otherNode = allPkgNodes[node.firstChildIndex];
            expect(otherNode).to.be.an('object');
            otherNode.parentIndex.should.equal(node.index);
          });
        });

      });

      describe( 'without children', function () {

        var group;

        beforeEach(function () {
          group = nodes.filter(function (node) {
            return !node.children.length;
          });
        });

        it( 'should be -1', function () {
          group.forEach(function (node) {
            node.firstChildIndex.should.equal(-1);
          });
        });

      });

    });

    describe( '.lastChildIndex', function () {

      it( 'should be a numeric property', function () {
        nodes.forEach(function (node) {
          node.lastChildIndex.should.be.a('number');
        });
      });

      describe( 'with children', function () {

        var group;

        beforeEach(function () {
          group = nodes.filter(function (node) {
            return node.children.length;
          });
        });

        it( 'should be the index of a node that points to this one via their `.parentIndex`', function () {
          group.forEach(function (node) {
            var otherNode = allPkgNodes[node.lastChildIndex];
            expect(otherNode).to.be.an('object');
            otherNode.parentIndex.should.equal(node.index);
          });
        });

      });

      describe( 'without children', function () {

        var group;

        beforeEach(function () {
          group = nodes.filter(function (node) {
            return !node.children.length;
          });
        });

        it( 'should be -1', function () {
          group.forEach(function (node) {
            node.lastChildIndex.should.equal(-1);
          });
        });

      });

    });

    describe( '.childIndex', function () {

      it( 'should be a numeric property', function () {
        nodes.forEach(function (node) {
          node.childIndex.should.be.a('number');
        });
      });

      it( 'should be the index of this node in the parent `.children` array', function () {
        nodes.forEach(function (node) {
          var otherNode = allPkgNodes[node.parentIndex];
          otherNode.children.indexOf(node.index).should.equal(node.childIndex);
        });
      });

      it( 'should be 0 or above', function () {
        nodes.forEach(function (node) {
          node.childIndex.should.be.above(-1);
        });
      });

    });

    describe( '.children', function () {

      it( 'should be an array property', function () {
        nodes.forEach(function (node) {
          expect(node.children).to.be.an('array');
        });
      });

      describe( 'with children', function () {
        var group;

        beforeEach(function () {
          group = nodes.filter(function (node) {
            return node.children.length;
          });
        });

        it( 'should contain indexes of nodes that point to this one via their `.parentIndex`', function () {
          group.forEach(function (node) {
            node.children.forEach(function (childIndex) {
              var otherNode = allPkgNodes[childIndex];
              expect(otherNode.parentIndex).to.equal(node.index);
            });
          });
        });

      });

      describe( 'without children', function () {
        var group;

        beforeEach(function () {
          group = nodes.filter(function (node) {
            return !node.children.length;
          });
        });

        it( 'should be empty', function () {
          group.forEach(function (node) {
            node.children.should.be.empty;
          });
        });

      });

    });

  });

});
