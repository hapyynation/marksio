(function () {
  try {
    var ENDPOINT = 'https://app.marksio.com/api/track';
    var STORE_ID = '{{STORE_ID}}';

    var sessionId = localStorage.getItem('_mks_sid');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      localStorage.setItem('_mks_sid', sessionId);
    }

    var ua = navigator.userAgent;
    var device = /Mobile|Android|iPhone/i.test(ua) ? 'mobile'
               : /Tablet|iPad/i.test(ua) ? 'tablet'
               : 'desktop';

    var browser = ua.includes('Chrome') && !ua.includes('Edg') ? 'Chrome'
                : ua.includes('Edg') ? 'Edge'
                : ua.includes('Firefox') ? 'Firefox'
                : ua.includes('Safari') ? 'Safari'
                : 'Other';

    function track(eventType, metadata) {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: STORE_ID,
          sessionId: sessionId,
          eventType: eventType,
          pageUrl: window.location.href,
          device: device,
          browser: browser,
          metadata: metadata || {}
        }),
        keepalive: true
      }).catch(function () {});
    }

    track('page_view');

    if (window.location.pathname.includes('/products/')) {
      track('product_view', {
        productHandle: window.location.pathname.split('/products/')[1]
      });
    }

    if (window.location.pathname.includes('/checkout')) {
      track('checkout_start');
    }

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[name="add"]') || e.target.closest('.add-to-cart') || e.target.closest('[data-testid="add-to-cart"]');
      if (btn) track('add_to_cart');
    });

    setInterval(function () { track('heartbeat'); }, 30000);

    window.addEventListener('beforeunload', function () { track('page_leave'); });
  } catch (e) {}
})();
