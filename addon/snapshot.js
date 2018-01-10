import ajax from 'ember-fetch/ajax';
import run from 'ember-runloop';

function matches(el, selector) {
  return (
    el.matches ||
    el.matchesSelector ||
    el.msMatchesSelector ||
    el.mozMatchesSelector ||
    el.webkitMatchesSelector ||
    el.oMatchesSelector
  ).call(el, selector);
}

function getDoctype() {
  let doctypeNode = document.doctype;
  if (!doctypeNode || !doctypeNode.name) {
    return '<!DOCTYPE html>';
  }
  let doctype = "<!DOCTYPE " +
    doctypeNode.name +
    (doctypeNode.publicId ? ' PUBLIC "' + doctypeNode.publicId + '"' : '') +
    (!doctypeNode.publicId && doctypeNode.systemId ? ' SYSTEM' : '') +
    (doctypeNode.systemId ? ' "' + doctypeNode.systemId + '"' : '') +
    '>';
  return doctype;
}

function bubbleErrors(response) {
  if (response.status === 400) {
    // Bubble up 400 errors, ie. when given options are invalid.
    let error = new Error(response.statusText);
    error.response = response;
    throw error;
  }
}

// Set the property value into the attribute value for snapshotting inputs
function setAttributeValues(dom) {
  // List of input types here https://www.w3.org/TR/html5/forms.html#the-input-element

  // Limit scope to inputs only as textareas do not retain their value when cloned
  let elems = dom.querySelectorAll(
    `input[type=text], input[type=search], input[type=tel], input[type=url], input[type=email],
     input[type=password], input[type=number], input[type=checkbox], input[type=radio]`
  );

  Array.prototype.forEach.call(elems, function(elem) {
    switch(elem.getAttribute('type')) {
      case 'checkbox':
      case 'radio':
        if (matches(elem, ':checked')) {
          elem.setAttribute('checked', '');
        }
        break;
      default:
        elem.setAttribute('value', elem.value);
    }
  });

  return dom;
}

function setTextareaContent(dom) {
  Array.prototype.forEach.call(dom.querySelectorAll('textarea'), function(elem) {
    elem.textContent = elem.value;
  });

  return dom;
}

export function percySnapshot(name, options) {
  // Skip if Testem is not available (we're probably running from `ember server` and Percy is not
  // enabled anyway).
  if (!window.Testem) {
    return;
  }

  // Automatic name generation for QUnit tests by passing in the `assert` object.
  if (name.test && name.test.module && name.test.module.name && name.test.testName) {
    name = `${name.test.module.name} | ${name.test.testName}`;
  } else if (name.fullTitle) {
    // Automatic name generation for Mocha tests by passing in the `this.test` object.
    name = name.fullTitle();
  }

  let snapshotRoot;
  options = options || {};
  let scope = options.scope;

  // Create a full-page DOM snapshot from the current testing page.
  // TODO(fotinakis): more memory-efficient way to do this?
  let domCopy = document.querySelector('html').cloneNode(true);
  let testingContainer = domCopy.querySelector('#ember-testing');

  if (scope) {
    snapshotRoot = testingContainer.querySelector(scope);
  } else {
    snapshotRoot = testingContainer;
  }

  snapshotRoot = setAttributeValues(snapshotRoot);

  let snapshotHtml = snapshotRoot.innerHTML;

  // Hoist the testing container contents up to the body.
  // We need to use the original DOM to keep the head stylesheet around.
  domCopy.querySelector('body').innerHTML = snapshotHtml;

  domCopy = setTextareaContent(domCopy);

  let { widths, breakpoints, enableJavaScript } = options;
  let content = getDoctype() + domCopy.outerHTML;

  run(function() {
    return ajax('/_percy/snapshot', {
      mode: 'cors',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        name,
        content,
        widths,
        breakpoints,
        enableJavaScript,
      })
    })
    .then(bubbleErrors);
  });
}
