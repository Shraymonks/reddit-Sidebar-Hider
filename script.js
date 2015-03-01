var isHidden = false;

// Setup sidebar CSS with initial toggle setting
//
// This is done here with an injected <style> instead of 
// adding a class to .side to prevent any reflow or flash
// from initially hiding the sidebar
chrome.storage.local.get({isHidden: false}, function(items) {
  var style = document.createElement('style');

  isHidden = items.isHidden;

  // style.sheet gets created after style is inserted into the DOM
  document.head.appendChild(style);

  if (isHidden) {
    style.sheet.insertRule('.side {display: none}', 0);
  }
  style.sheet.insertRule('.side.toggle {display: ' + (isHidden ? 'block' : 'none') + '}', style.sheet.length);
});

// Create the toggle link
document.addEventListener('DOMContentLoaded', function() {
  var fragment = document.createDocumentFragment();
  var header = document.getElementById('header-bottom-right');
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
