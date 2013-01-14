var
  Panzer = require('../src/panzer'),
  sinon = require('sinon'),
  chai = require('chai'),
  sinonChai = require('sinon-chai')
;

chai.use(sinonChai);
chai.should();

global.Panzer = Panzer;
global.sinon = sinon;
global.expect = chai.expect;