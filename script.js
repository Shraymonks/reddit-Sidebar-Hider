var isHidden = false;

// Setup sidebar CSS with initial toggle setting
//
// This is done here with an injected <style> instead of
// adding a class to .side to prevent any reflow or flash
// while initially hiding the sidebar
chrome.storage.local.get({isHidden: false}, function(items) {
  var style = document.createElement('style');

  isHidden = items.isHidden;

  // style.sheet gets created after style is inserted into the DOM
  document.head.appendChild(style);

  var sidebarSelector = isHidden ? '.side:not(.toggle)' : '.side.toggle';

  style.sheet.insertRule(sidebarSelector + ' {display: none}', 0);
});

// Create the toggle link
document.addEventListener('DOMContentLoaded', function() {
  var header = document.getElementById('header-bottom-right');

  // Make sure reddit works
  if (!header) return;

  var fragment = document.createDocumentFragment();
  var separator = header.getElementsByClassName('separator')[0].cloneNode(true);
  var side = document.getElementsByClassName('side')[0];
  var toggle = document.createElement('a');

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
});
