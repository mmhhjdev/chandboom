// SPA redirect decoder for GitHub Pages (404.html encodes the path into the query string).
// Kept as an external file so the Content-Security-Policy can forbid inline scripts.
(function (l) {
  if (l.search && l.search[1] === '/') {
    var decoded = l.search.slice(1).split('&').map(function (s) {
      return s.replace(/~and~/g, '&');
    }).join('?');
    window.history.replaceState(null, null, l.pathname.slice(0, -1) + decoded + l.hash);
  }
}(window.location));
