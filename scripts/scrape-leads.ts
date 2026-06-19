/**
 * Apify ile Türk KOBİ e-ticaret mağazalarından lead toplama scripti.
 *
 * Phase 1: Store Leads sayfalarından mağaza domain listesi çıkar
 * Phase 2: Her mağazanın iletişim sayfasından email adresi topla
 * Phase 3: Filtrele ve CSV'ye yaz
 *
 * Çalıştırmak için:
 *   APIFY_API_KEY=xxx npm run scrape
 */

import * as fs from 'fs';
import * as path from 'path';

const TOKEN = process.env.APIFY_API_KEY;
if (!TOKEN) {
  console.error('Hata: APIFY_API_KEY ortam değişkeni gerekli');
  process.exit(1);
}

const APIFY_API = 'https://api.apify.com/v2';
const OUT_DIR = path.resolve(__dirname, '..', 'output');
const OUT_FILE = path.join(OUT_DIR, 'leads_apify.csv');
const MAX_LEADS = 50;
const MAX_STORES_TO_SCAN = 150;

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

async function apiFetch(endpoint: string, method = 'GET', body?: JsonValue): Promise<JsonValue> {
  const url = `${APIFY_API}${endpoint}?token=${TOKEN}`;
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Apify [${method} ${endpoint}] ${res.status}: ${text.slice(0, 300)}`);
  }
  return JSON.parse(text);
}

interface RunInfo { runId: string; datasetId: string }

async function startRun(actorId: string, input: JsonValue): Promise<RunInfo> {
  const resp = await apiFetch(`/acts/${encodeURIComponent(actorId)}/runs`, 'POST', input) as {
    data: { id: string; defaultDatasetId: string };
  };
  return { runId: resp.data.id, datasetId: resp.data.defaultDatasetId };
}

async function waitForRun({ runId }: RunInfo): Promise<void> {
  const terminal = new Set(['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT']);
  while (true) {
    await new Promise(r => setTimeout(r, 8000));
    const resp = await apiFetch(`/actor-runs/${runId}`) as { data: { status: string } };
    const s = resp.data.status;
    process.stdout.write(`  [${s}]   \r`);
    if (terminal.has(s)) {
      console.log(`\n  Bitti: ${s}`);
      if (s !== 'SUCCEEDED') throw new Error(`Run başarısız: ${s}`);
      return;
    }
  }
}

async function getItems(datasetId: string): Promise<JsonValue[]> {
  const items = await apiFetch(`/datasets/${datasetId}/items`) as JsonValue[];
  return Array.isArray(items) ? items : [];
}

// ---------------------------------------------------------------------------
// Phase 1 — Store Leads sayfalarından mağaza domainleri
// ---------------------------------------------------------------------------

const STORE_PAGE_FN = /* javascript */`
async function pageFunction(context) {
  var page = context.page;
  var request = context.request;
  var log = context.log;

  var platform = (request.userData && request.userData.platform) ? request.userData.platform : 'Unknown';

  // JS render için bekle
  await new Promise(function(r) { setTimeout(r, 5000); });

  var skipList = [
    'storeleads.app', 'facebook.com', 'instagram.com', 'twitter.com', 'x.com',
    'linkedin.com', 'google.com', 'youtube.com', 'tiktok.com', 'pinterest.com',
    'apple.com', 'shopify.com', 'shopifycdn.com', 'myshopify.com',
    'wordpress.com', 'woocommerce.com', 'ikas.com', 'cloudflare.com',
    'amazonaws.com', 'vercel.app', 'netlify.app', 'github.com',
    'gstatic.com', 'googleapis.com', 'doubleclick.net', 'adsbygoogle.com'
  ];

  var stores = await page.evaluate(function(skip) {
    var anchors = Array.from(document.querySelectorAll('a[href]'));
    var seen = Object.create(null);
    var result = [];

    anchors.forEach(function(a) {
      var href = a.href || '';
      var text = (a.textContent || '').trim().slice(0, 120);
      if (!href.startsWith('http')) return;

      try {
        var url = new URL(href);
        var domain = url.hostname.replace(/^www\\./, '');
        if (!domain || domain in seen) return;
        if (skip.some(function(s) { return domain.includes(s); })) return;

        var parts = domain.split('.');
        if (parts.length < 2) return;
        var tld = parts[parts.length - 1];
        if (tld.length < 2 || tld.length > 6) return;

        seen[domain] = true;
        result.push({ domain: domain, brand: text || domain });
      } catch (e) {}
    });

    return result;
  }, skipList);

  log.info('Bulunan mağaza adayı: ' + stores.length + ' — ' + request.url);
  return stores.map(function(s) {
    return { domain: s.domain, brand: s.brand, platform: platform };
  });
}
`.trim();

interface StoreItem { domain: string; brand: string; platform: string }

async function phase1GetStores(): Promise<StoreItem[]> {
  console.log('\n=== Phase 1: Store Leads\'ten Türk mağazaları ===\n');

  const input: JsonValue = {
    startUrls: [
      { url: 'https://storeleads.app/reports/shopify/TR/top-stores', userData: { platform: 'Shopify' } },
      { url: 'https://storeleads.app/reports/ikas/TR/top-stores', userData: { platform: 'İkas' } },
      { url: 'https://storeleads.app/reports/woocommerce/TR/top-stores', userData: { platform: 'WooCommerce' } },
    ],
    pageFunction: STORE_PAGE_FN,
    maxCrawlingDepth: 0,
    maxPagesPerCrawl: 3,
    maxConcurrency: 3,
    navigationTimeoutSecs: 90,
    pageLoadTimeoutSecs: 60,
  };

  const run = await startRun('apify/web-scraper', input);
  console.log(`Run ID: ${run.runId}`);
  await waitForRun(run);

  const raw = await getItems(run.datasetId);
  const stores: StoreItem[] = [];

  for (const item of raw) {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const r = item as Record<string, unknown>;
      if (typeof r.domain === 'string' && r.domain) {
        stores.push({
          domain: r.domain,
          brand: typeof r.brand === 'string' ? r.brand : r.domain,
          platform: typeof r.platform === 'string' ? r.platform : 'Unknown',
        });
      }
    }
  }

  // Tekrarlananları kaldır
  const seen = new Set<string>();
  const unique = stores.filter(s => {
    if (seen.has(s.domain)) return false;
    seen.add(s.domain);
    return true;
  });

  console.log(`\nToplam benzersiz mağaza adayı: ${unique.length}`);
  return unique;
}

// ---------------------------------------------------------------------------
// Phase 2 — İletişim sayfalarından email adresleri
// ---------------------------------------------------------------------------

const EMAIL_PAGE_FN = /* javascript */`
async function pageFunction(context) {
  var $ = context.$;
  var request = context.request;
  var ud = request.userData || {};

  var emailRegex = /[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}/g;

  var bodyText = ($('body').text() || '') + ' ' + ($('body').html() || '');
  var raw = bodyText.match(emailRegex) || [];

  var emails = Array.from(new Set(raw)).filter(function(e) {
    e = e.toLowerCase();
    // .com.tr email'leri kurumsal — atla
    if (e.endsWith('@' + ud.domain)) return false; // kendi domaininden gelen base check
    if (e.includes('.com.tr')) return false;
    // Teknik/sistem adresleri
    if (/\.(png|jpg|jpeg|gif|svg|webp|css|js)$/.test(e)) return false;
    if (e.includes('@sentry') || e.includes('@example') || e.includes('@email.com')) return false;
    if (e.includes('noreply') && e.includes('shopify')) return false;
    return true;
  });

  if (emails.length === 0) return null;

  return {
    domain: ud.domain || '',
    brand: ud.brand || '',
    platform: ud.platform || '',
    emails: emails.slice(0, 5),
    contactUrl: request.url
  };
}
`.trim();

interface ContactItem {
  domain: string;
  brand: string;
  platform: string;
  emails: string[];
  contactUrl: string;
}

async function phase2GetEmails(stores: StoreItem[]): Promise<ContactItem[]> {
  console.log(`\n=== Phase 2: ${stores.length} mağazanın iletişim sayfaları ===\n`);

  const contactPaths = ['/iletisim', '/contact', '/pages/iletisim', '/pages/contact'];
  const startUrls: JsonValue[] = [];

  for (const store of stores.slice(0, MAX_STORES_TO_SCAN)) {
    for (const p of contactPaths) {
      startUrls.push({
        url: `https://${store.domain}${p}`,
        userData: { domain: store.domain, brand: store.brand, platform: store.platform },
      });
    }
  }

  if (startUrls.length === 0) return [];

  const input: JsonValue = {
    startUrls,
    pageFunction: EMAIL_PAGE_FN,
    maxCrawlingDepth: 0,
    maxConcurrency: 15,
    navigationTimeoutSecs: 20,
    ignoreSslErrors: true,
  };

  const run = await startRun('apify/cheerio-scraper', input);
  console.log(`Run ID: ${run.runId}`);
  await waitForRun(run);

  const raw = await getItems(run.datasetId);
  const results: ContactItem[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const r = item as Record<string, unknown>;
    if (!r.domain || !Array.isArray(r.emails) || r.emails.length === 0) continue;
    results.push({
      domain: String(r.domain),
      brand: String(r.brand || r.domain),
      platform: String(r.platform || ''),
      emails: (r.emails as unknown[]).filter((e): e is string => typeof e === 'string'),
      contactUrl: String(r.contactUrl || ''),
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Phase 3 — Lead listesi oluştur + CSV yaz
// ---------------------------------------------------------------------------

interface Lead {
  email: string;
  brand: string;
  website: string;
  platform: string;
  category: string;
  note: string;
}

function buildLeads(contacts: ContactItem[]): Lead[] {
  // Domain başına tüm emailları topla (birden fazla iletişim URL'si olabilir)
  const byDomain = new Map<string, { emails: Set<string>; brand: string; platform: string }>();

  for (const c of contacts) {
    if (!byDomain.has(c.domain)) {
      byDomain.set(c.domain, { emails: new Set(), brand: c.brand, platform: c.platform });
    }
    const entry = byDomain.get(c.domain)!;
    for (const e of c.emails) entry.emails.add(e.toLowerCase().trim());
  }

  const leads: Lead[] = [];

  for (const [domain, { emails, brand, platform }] of byDomain) {
    if (emails.size === 0) continue;

    const list = [...emails];

    // Tercih sırası: info/destek > diğerleri > noreply
    const pick =
      list.find(e => /^(info|destek|support|hello|merhaba|satis|siparis)@/.test(e)) ||
      list.find(e => !e.startsWith('noreply@') && !e.startsWith('no-reply@')) ||
      list[0];

    if (!pick) continue;

    const extras = list.filter(e => e !== pick);

    leads.push({
      email: pick,
      brand: brand.slice(0, 100),
      website: domain,
      platform,
      category: 'E-Ticaret',
      note: extras.length > 0 ? `Diğer: ${extras.join('; ')}` : '',
    });
  }

  // En fazla MAX_LEADS kadar
  return leads.slice(0, MAX_LEADS);
}

function escapeCSV(val: string): string {
  return `"${val.replace(/"/g, '""')}"`;
}

function writeCSV(leads: Lead[]): void {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const header = 'Email,Marka,Website,Platform,Kategori,Not';
  const rows = leads.map(l =>
    [l.email, l.brand, l.website, l.platform, l.category, l.note]
      .map(escapeCSV)
      .join(',')
  );

  fs.writeFileSync(OUT_FILE, [header, ...rows].join('\n'), 'utf8');

  console.log(`\nCSV kaydedildi: ${OUT_FILE}`);
  console.log(`Toplam lead: ${leads.length}\n`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('================================================');
  console.log('  Marksio — Apify KOBİ E-Ticaret Lead Scraper');
  console.log(`  Hedef: ${MAX_LEADS} Türk mağaza lead\'i`);
  console.log('================================================');

  const stores = await phase1GetStores();

  if (stores.length === 0) {
    console.warn('\nUYARI: Phase 1\'de hiç mağaza bulunamadı.');
    console.warn('Store Leads sayfaları kimlik doğrulama gerektirebilir veya bot koruması olabilir.');
    console.warn('Manuel olarak https://storeleads.app/reports/shopify/TR/top-stores adresine bakın.');
    process.exit(1);
  }

  const contacts = await phase2GetEmails(stores);
  const leads = buildLeads(contacts);

  if (leads.length === 0) {
    console.warn('\nUYARI: Email bulunamadı. İletişim sayfaları farklı URL yapısında olabilir.');
    process.exit(0);
  }

  writeCSV(leads);

  console.log('İlk 10 lead önizleme:');
  console.log('─'.repeat(70));
  leads.slice(0, 10).forEach((l, i) => {
    console.log(`${String(i + 1).padStart(2)}. ${l.email.padEnd(36)} ${l.brand.slice(0, 25)}`);
  });
  console.log('─'.repeat(70));
}

main().catch(err => {
  console.error('\nKritik hata:', err instanceof Error ? err.message : err);
  process.exit(1);
});
