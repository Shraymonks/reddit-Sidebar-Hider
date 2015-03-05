var isHidden = false;
var style = document.createElement('style');
// Key used to store styles for this page; either r/subreddit or the root pathname
var page = (function() {
  var path = location.pathname.split('/');
  return path[1] === 'r' ? 'r/' + path[2] : path[1];
}());
var pageStyle = {};
var pageStyles = {};

var createRule = function(selector, elemStyle) {
  var rule = selector + '{';

  for (var prop in elemStyle) {
    rule += prop + ':' + elemStyle[prop] + ' !important;';
  }
  return rule + '}';
};

var insertRule = function(elem, elemStyle) {
  if (Object.keys(elemStyle).length === 0) return;

  // Redundant selectors like `.side.side` are to increase specificity
  // to safeguard against subreddits that use `!important`
  var selector;
  switch (elem) {
    case 'main':
      selector = '.content[role="main"]';
      break;
    case 'side':
      selector = '.side.side';
      break;
    case 'siteTable':
      selector = '#siteTable#siteTable';
      break;
  }
  style.sheet.insertRule(createRule(selector, elemStyle), style.sheet.length);
};

// Setup sidebar CSS with initial toggle setting
//
// This is done here with an injected <style> instead of
// adding a class to .side to prevent any reflow or flash
// while initially hiding the sidebar
chrome.storage.local.get({isHidden: false, pageStyles: {}}, function(items) {
  isHidden = items.isHidden;

  // style.sheet gets created after style is inserted into the DOM
  document.head.appendChild(style);

  var sideSelector = isHidden ? '.side:not(.toggle)' : '.side.toggle';

  // Hiding the sidebar like this instead of `display: none;` allows
  // absolutely positioned headers in subreddit themes to still appear
  style.sheet.insertRule(
    sideSelector + ' {' +
      'height: 0 !important;' +
      'margin: 0 !important;' +
      'padding: 0 !important;' +
      'width: 0 !important}',
    0
  );
  // Hide other absolute elements that may appear in some themes
  style.sheet.insertRule(
    sideSelector + '::after,' +
    sideSelector + '::before,' +
    sideSelector + ' .spacer > :not(.titlebox),' +
    sideSelector + ' .titlebox > :not(.usertext),' +
    sideSelector + ' .md > p {display: none}',
    1
  );

  pageStyles = items.pageStyles;
  pageStyle = pageStyles[page];

  // Match margins of the subreddit theme
  if (pageStyle) {
    for (var elem in pageStyle) {
      insertRule(elem, pageStyle[elem]);
    }
  }
});

document.addEventListener('DOMContentLoaded', function() {
  var side = document.getElementsByClassName('side')[0];

  // Make sure there's a sidebar
  if (!side) return;

  var header = document.getElementById('header-bottom-right');
  var fragment = document.createDocumentFragment();
  var main = document.querySelector('[role="main"]');
  var separator = header.getElementsByClassName('separator')[0].cloneNode(true);
  var siteTable = document.getElementById('siteTable');
  var toggle = document.createElement('a');

  // Create the toggle link
  toggle.className = 'toggle-sidebar';
  toggle.innerText = 'Toggle sidebar';
  toggle.addEventListener('click', function() {
    isHidden = !isHidden;
    side.classList.toggle('toggle');
    chrome.storage.local.set({isHidden: isHidden});
  });

  fragment.appendChild(separator);
  fragment.appendChild(toggle);
  header.appendChild(fragment);


  // Match subreddit theme margins
  if (!pageStyle) {
    pageStyles[page] = {};
    pageStyle = pageStyles[page];
  }

  var newStyles = false;

  // Theme margins are stored so that they can be applied before the DOM is loaded
  // on subsequent page loads, elimintating reflow
  var mainStyle = getComputedStyle(main);
  if (mainStyle.marginLeft !== mainStyle.marginRight) {
    pageStyle.main = pageStyle.main || {};
    pageStyle.main['margin-right'] = mainStyle.marginLeft;
    insertRule('main', {'margin-right': mainStyle.marginLeft});
    newStyles = true;
  }

  var sideStyle = getComputedStyle(side);
  var sideMarginLeft = Math.max(
    parseInt(sideStyle.marginRight, 10),
    parseInt(mainStyle.marginLeft, 10)
  ) + 'px';
  if (sideStyle.marginLeft !== sideMarginLeft) {
    pageStyle.side = pageStyle.side || {};
    pageStyle.side['margin-left'] = sideMarginLeft;
    insertRule('side', {'margin-left': sideMarginLeft});
    newStyles = true;
  }

  if (siteTable) {
    var siteTableStyle = getComputedStyle(siteTable);
    if (siteTableStyle.marginLeft !== siteTableStyle.marginRight) {
      pageStyle.siteTable = pageStyle.siteTable || {};
      pageStyle.siteTable['margin-right'] = siteTableStyle.marginLeft;
      insertRule('siteTable', {'margin-right': siteTableStyle.marginLeft});
      newStyles = true;
    }
    if (siteTableStyle.paddingLeft !== siteTableStyle.paddingRight) {
      pageStyle.siteTable = pageStyle.siteTable || {};
      pageStyle.siteTable['padding-right'] = siteTableStyle.paddingLeft;
      insertRule('siteTable', {'padding-right': siteTableStyle.paddingLeft});
      newStyles = true;
    }
  }

  if (newStyles) {
    chrome.storage.local.set({pageStyles: pageStyles});
  }
});
