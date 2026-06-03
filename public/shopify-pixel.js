/**
 * Marksio Shopify Pixel
 * Sayfa görüntülemelerini ve checkout olaylarını takip eder.
 * Bu dosya Shopify mağazalarına Script Tag olarak eklenir.
 */
(function () {
  try {
    var ENDPOINT = 'https://app.marksio.com/api/track/visit';
    var shopDomain = window.Shopify && window.Shopify.shop ? window.Shopify.shop : window.location.hostname;
    var path = window.location.pathname;
    var ref = document.referrer || '';
    var source = 'direct';

    // UTM source tespiti
    try {
      var params = new URLSearchParams(window.location.search);
      var utmSource = params.get('utm_source');
      var utmMedium = params.get('utm_medium');
      if (utmSource) source = utmMedium ? utmSource + ' / ' + utmMedium : utmSource;
      else if (ref.includes('google'))    source = 'google / organic';
      else if (ref.includes('facebook'))  source = 'facebook / ads';
      else if (ref.includes('instagram')) source = 'instagram / story';
      else if (ref.includes('tiktok'))    source = 'tiktok / ads';
      else if (ref)                       source = 'referral';
    } catch (e) {}

    // Cihaz tespiti
    var device = /Mobi|Android/i.test(navigator.userAgent) ? 'mobile'
               : /Tablet|iPad/i.test(navigator.userAgent)  ? 'tablet'
               : 'desktop';

    // Mevcut müşteri email'i (Shopify customer objesinden)
    var email = window.ShopifyAnalytics && window.ShopifyAnalytics.meta
      ? (window.ShopifyAnalytics.meta.email || '')
      : (window.__st && window.__st.cid ? '' : '');

    var payload = {
      shopDomain: shopDomain,
      path: path,
      source: source,
      ref: ref,
      device: device,
      country: (window.Shopify && window.Shopify.locale) || '',
      email: email,
    };

    // Beacon API kullan (sayfa kapanırken de çalışır)
    if (navigator.sendBeacon) {
      var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(ENDPOINT, blob);
    } else {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(function () {});
    }
  } catch (e) {}
})();
