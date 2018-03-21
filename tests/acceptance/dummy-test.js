import { test } from 'qunit';
import moduleForAcceptance from '../../tests/helpers/module-for-acceptance';

moduleForAcceptance('Acceptance | dummy');

test('visiting /', function(assert) {
  visit('/');
  andThen(function() {
    assert.equal(currentURL(), '/');
  });
  percySnapshot('dummy homepage test');
});

test('duplicate snapshots are skipped', function(assert) {
  visit('/');
  andThen(function() {
    assert.equal(currentURL(), '/');
  });
  percySnapshot('dupe test');
  // Test duplicate name (should log warning and skip this snapshot):
  percySnapshot('dupe test');
});

test('name is autogenerated if given a QUnit assert object', function(assert) {
  assert.expect(0);
  percySnapshot(assert);
});

test('name is autogenerated if given a Mocha test object', function(assert) {
  assert.expect(0);
  var mochaTestDouble = {
    fullTitle: function() {
      return 'acceptance test - mocked fullTitle for Mocha tests';
    },
  };
  percySnapshot(mochaTestDouble);
});

test('enableJavaScript option can pass through', function(assert) {
  visit('/');
  andThen(function() {
    assert.equal(currentURL(), '/');
  });
  percySnapshot(assert, {enableJavaScript: true});
});

test('attributes on rootElement are copied to the DOM snapshot', function(assert) {
  visit('/test-route-styles');
  andThen(function() {
    assert.equal(currentURL(), '/test-route-styles');
  });
  percySnapshot(assert);
});

test('class on body that turns it green is preserved the DOM snapshot', function(assert) {
  visit('/');
  // find('body').attr('class', 'all-green');
  console.log(find('body'));
  andThen(function() {
    assert.equal(currentURL(), '/');
  });
  percySnapshot(assert);
});
