const { looksLikeFallback, FALLBACK_MARKERS } = require('./fallbackMarkers');
console.log('FALLBACK_MARKERS count:', FALLBACK_MARKERS.length);
console.log('Testing fake data:', looksLikeFallback('fake data'));
console.log('Testing fake dataset:', looksLikeFallback('fake dataset'));
console.log('Testing fake output:', looksLikeFallback('fake output'));
console.log('Testing synthetic output:', looksLikeFallback('synthetic output'));
console.log('Testing generated test data:', looksLikeFallback('generated test data'));
console.log('Testing dummy data:', looksLikeFallback('dummy data'));
console.log('Testing dummy output:', looksLikeFallback('dummy output'));
