/**
 * whatsapp-knowledge Supabase Storage bucket kurulumu + doğrulama
 *
 * Kullanım:
 *   node --env-file=.env.local node_modules/ts-node/dist/bin.js scripts/setup-whatsapp-storage.ts
 */

import { createClient } from '@supabase/supabase-js'

const BUCKET = 'whatsapp-knowledge'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik')
  return createClient(url, key, { auth: { persistSession: false } })
}

async function main() {
  const supabase = getAdminClient()
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

  // 1. Mevcut bucket listesini kontrol et
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets()
  if (listErr) throw new Error('Bucket listesi alınamadı: ' + listErr.message)

  const exists = buckets.some(b => b.name === BUCKET)
  console.log(`\n[1] Mevcut bucket'lar: ${buckets.map(b => b.name).join(', ') || '(yok)'}`)

  if (exists) {
    console.log(`[1] '${BUCKET}' zaten mevcut — yeniden oluşturma atlandı.`)
  } else {
    // 2. Public bucket oluştur
    // Neden public: upload route'u getPublicUrl() kullanıyor, createSignedUrl() değil.
    // PDF'ler AI assistant tarafından okunacak — public URL gerekli.
    const { data, error: createErr } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB (upload route'undaki sınırla uyumlu)
      allowedMimeTypes: ['application/pdf'],
    })
    if (createErr) throw new Error('Bucket oluşturulamadı: ' + createErr.message)
    console.log(`[2] Bucket oluşturuldu: ${JSON.stringify(data)}`)
  }

  // 3. Bucket'ın gerçekten public olduğunu doğrula
  const { data: bucketInfo, error: getErr } = await supabase.storage.getBucket(BUCKET)
  if (getErr) throw new Error('Bucket bilgisi alınamadı: ' + getErr.message)
  console.log(`\n[3] Bucket durumu:`)
  console.log(`    name:   ${bucketInfo.name}`)
  console.log(`    public: ${bucketInfo.public}`)
  console.log(`    created: ${bucketInfo.created_at}`)

  if (!bucketInfo.public) {
    // Eğer private yaratılmışsa public'e çevir
    const { error: updateErr } = await supabase.storage.updateBucket(BUCKET, { public: true })
    if (updateErr) throw new Error('Bucket public yapılamadı: ' + updateErr.message)
    console.log('    → Public olarak güncellendi.')
  }

  // 4. Gerçek bir PDF yükleyerek doğrula
  const testFileName = `_test/setup-verify-${Date.now()}.pdf`
  // Minimal geçerli PDF (1 sayfa, sadece header)
  const minimalPdf = Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj ' +
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj ' +
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\n' +
    'xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n' +
    '0000000058 00000 n \n0000000115 00000 n \n' +
    'trailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF'
  )

  console.log(`\n[4] Test PDF yükleniyor: ${testFileName}`)
  const { data: uploadData, error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(testFileName, minimalPdf, { contentType: 'application/pdf', upsert: true })

  if (uploadErr) {
    throw new Error(`UPLOAD BAŞARISIZ: ${uploadErr.message}`)
  }
  console.log(`    Upload başarılı: path=${uploadData.path}`)

  // 5. Public URL'yi al ve doğrula
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(testFileName)
  console.log(`    Public URL: ${urlData.publicUrl}`)

  // HTTP HEAD ile URL'nin gerçekten erişilebilir olduğunu kontrol et
  const resp = await fetch(urlData.publicUrl, { method: 'HEAD' })
  console.log(`    URL HTTP status: ${resp.status} ${resp.statusText}`)
  if (resp.status !== 200) {
    console.warn(`    UYARI: Beklenen 200, alınan ${resp.status}`)
  }

  // 6. Test dosyasını temizle
  const { error: delErr } = await supabase.storage.from(BUCKET).remove([testFileName])
  if (delErr) console.warn('Test dosyası silinemedi (önemsiz):', delErr.message)
  else console.log(`    Test dosyası silindi.`)

  console.log(`\n✓ '${BUCKET}' bucket hazır. PDF yükleme çalışıyor.`)
}

main().catch(err => {
  console.error('\n✗ HATA:', err.message)
  process.exit(1)
})
