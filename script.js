'use strict';

var isHidden = false;

// Key used to store styles for this page; either r/subreddit or the root pathname
var page = (function() {
  var path = location.pathname.split('/');
  return (path[1] === 'r' ? 'r/' + path[2] : path[1]).toLowerCase();
}());

var pageStyle = {};
var pageStyles = {};

var style = document.createElement('style');

var createRule = function(selector, elemStyle) {
  var rule = selector + '{';

  for (var prop in elemStyle) {
    rule += prop + ':' + elemStyle[prop] + ' !important;';
  }
  return rule + '}';
};

// Redundant selectors like `.side.side` are to increase specificity
// to safeguard against subreddits that use `!important`
var selectors = {
  main: '.content.content[role="main"]',
  side: '.side.side',
  siteTable: '#siteTable#siteTable'
};

var insertRule = function(elem, elemStyle) {
  if (Object.keys(elemStyle).length > 0) {
    style.sheet.insertRule(createRule(selectors[elem], elemStyle), style.sheet.cssRules.length);
  }
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

  var bodySelector = isHidden ? 'body:not(.side-toggle)' : 'body.side-toggle';
  var sideSelector = bodySelector + ' .side';

  // Hiding the sidebar like this instead of `display: none;` allows
  // absolutely positioned headers in subreddit themes to still appear
  style.sheet.insertRule(
    sideSelector + ' {' +
      'border: 0 !important;' +
      'height: 0 !important;' +
      'margin: 0 !important;' +
      'overflow: hidden !important;' +
      'padding: 0 !important;' +
      'width: 0 !important}',
    0
  );
  // Hide other absolute elements that may appear in some themes
  style.sheet.insertRule(
    sideSelector + '::after,' +
    sideSelector + '::before,' +
    sideSelector + ' ::after,' +
    sideSelector + ' .spacer > :not(.titlebox),' +
    sideSelector + ' .titlebox > :not(.usertext),' +
    sideSelector + ' .md > p {display: none !important}',
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

  // Page specific compatibility CSS
  switch (page) {
    case 'r/movies':
      style.sheet.insertRule(
        sideSelector + ' .titlebox > .subscribers,' +
        sideSelector + ' .titlebox > .users-online {display: block !important}',
        style.sheet.cssRules.length
      );
      style.sheet.insertRule(
        sideSelector + ' .number::after {display: inline !important}',
        style.sheet.cssRules.length
      );
      style.sheet.insertRule(
        bodySelector + ' .usertext-body h3:last-of-type a,' +
        bodySelector + ' input[name="uh"] ~ a::after {display: none !important}',
        style.sheet.cssRules.length
      );
      break;
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
    document.body.classList.toggle('side-toggle');
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

  var updateStyle = function(options) {
    if (options.cond) {
      pageStyle[options.elem] = pageStyle[options.elem] || {};
      pageStyle[options.elem][options.prop] = options.value;
      var rule = {};
      rule[options.prop] = options.value;
      insertRule(options.elem, rule);
      newStyles = true;
    }
  };

  // Theme margins are stored so that they can be applied before the DOM is loaded
  // on subsequent page loads, elimintating reflow

  var mainStyle = getComputedStyle(main);
  var sideStyle = getComputedStyle(side);

  updateStyle({
    cond: mainStyle.marginLeft !== mainStyle.marginRight,
    elem: 'main',
    prop: 'margin-right',
    value: mainStyle.marginLeft
  });
  updateStyle({
    cond: mainStyle.paddingLeft !== mainStyle.paddingRight,
    elem: 'main',
    prop: 'padding-right',
    value: mainStyle.paddingLeft
  });
  // Fix r/AskHistorians
  updateStyle({
    cond: parseInt(mainStyle.marginTop, 10) < 0,
    elem: 'main',
    prop: 'margin-top',
    value: 0
  });

  updateStyle({
    cond: sideStyle.marginLeft !== mainStyle.marginLeft,
    elem: 'side',
    prop: 'margin-left',
    value: mainStyle.marginLeft
  });

  if (siteTable) {
    var siteTableStyle = getComputedStyle(siteTable);

    updateStyle({
      cond: siteTableStyle.marginLeft !== siteTableStyle.marginRight,
      elem: 'siteTable',
      prop: 'margin-right',
      value: siteTableStyle.marginLeft
    });
    updateStyle({
      cond: siteTableStyle.paddingLeft !== siteTableStyle.paddingRight,
      elem: 'siteTable',
      prop: 'padding-right',
      value: siteTableStyle.paddingLeft
    });
  }

  if (newStyles) {
    chrome.storage.local.set({pageStyles: pageStyles});
  }
});
