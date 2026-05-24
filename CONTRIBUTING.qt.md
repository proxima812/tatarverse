# Katılım rehberi

Bu rehber, tatarverse.cc projesine yeni merkezler eklemeyi ve mevcut merkez bilgilerini doğru güncellemeyi anlatır.

## Genel kurallar

- Bir pull request içinde tek konu bırakın: yeni merkez, veri güncellemesi, çeviri ya da küçük düzeltme.
- Gerekmedikçe komşu dosyaları biçimlendirmeyin veya değiştirmeyin.
- Gerçek bilgi değişikliklerinde kaynak ekleyin: web sitesi, sosyal medya profili, resmi paylaşım, kurum sayfası veya doğrulanabilir başka bir bağlantı.
- Bilgi bilinmiyorsa alanı boş bırakın. `bilinmiyor`, `n/a`, `-` gibi dolgu değerleri yazmayın.
- Ton tarafsız olmalı: reklam, değerlendirme ve doğrulanmamış ifade kullanmayın.

## Merkezler nerede durur

Ana merkez dosyaları burada:

```txt
src/data/centers_formatted/
```

Çeviri dosyaları burada:

```txt
src/data/centers_i18n/en/
src/data/centers_i18n/tt/
src/data/centers_i18n/qt/
```

Rusça sürüm ana kaynak kabul edilir. Dosya adları diller arasında aynı olmalı, örneğin:

```txt
src/data/centers_formatted/tbk-366.mdx
src/data/centers_i18n/en/tbk-366.mdx
src/data/centers_i18n/tt/tbk-366.mdx
src/data/centers_i18n/qt/tbk-366.mdx
```

## Yeni merkez ekleme

1. `src/data/centers_formatted/` içinde sıradaki boş `tbk-*` numarasını bulun.
2. Bu numarayla yeni bir `.mdx` dosyası oluşturun.
3. Frontmatter bölümünü `src/content.config.ts` içindeki Zod şemasına göre doldurun.
4. Frontmatter altına kısa MDX içerik ekleyin: açıklama, bağlantılar ve kaynakla doğrulanan ayrıntılar.
5. Mümkünse aynı dosya adıyla `src/data/centers_i18n/en`, `tt`, `qt` sürümlerini ekleyin.

Minimal örnek:

```mdx
---
title: Merkez adı
type: Зарубежный
category: Татарский
source: https://example.com/
summary: Merkez hakkında kısa ve tarafsız açıklama.
location:
  country: Kazakistan
  city: Almatı
---

# Merkez adı

Doğrulanabilir bilgiye dayalı kısa açıklama.

## Bağlantılar

- [Resmi site](https://example.com/)
```

## Mevcut bilgiyi güncelleme

- Yalnızca gerçekten eski veya hatalı alanları ve metni değiştirin.
- `tbk-*` dosya adını değiştirmeyin: bu ad kalıcı slug olarak kullanılır.
- Eski bilgiyi sebepsiz silmeyin; güncel olmayan veriyi doğrulanmış veriyle değiştirin.
- `title`, `summary`, `location`, `source`, `type` veya `category` değişiyorsa kaynak bu değişikliği desteklemeli.
- Rusça sürümü değiştiriyorsanız çeviri sürümlerinin de güncellenmesi gerekip gerekmediğini kontrol edin.

## Zod alan şeması

Şema `src/content.config.ts` içinde tanımlıdır. Katıdır: frontmatter içinde fazladan alanlara izin verilmez.

İzin verilen alanlar:

- `title` - zorunlu string.
- `pubDate` - isteğe bağlı tarih string'i.
- `type` - isteğe bağlı merkez türü.
- `category` - isteğe bağlı merkez kategorisi.
- `source` - isteğe bağlı kaynak URL'i.
- `summary` - isteğe bağlı kısa açıklama.
- `location` - isteğe bağlı konum nesnesi.

`location` alanları:

- `country`
- `city`
- `region`
- `flag`

## Kategoriler ve türler

Merkezler için ayrı bir `tags` alanı şu anda yoktur. Gruplama `category` ve `type` alanlarıyla yapılır; ikisi de Zod enum ile sınırlıdır.

İzin verilen `category` değerleri:

- `Татарский`
- `Татаро-Башкирский`
- `Башкирский`
- `Крымотатарский`

İzin verilen `type` değerleri:

- `Регион РФ`
- `Зарубежный`
- `Онлайн`

Yeni kategori veya türü doğrudan MDX içine eklemeyin. Yeni değer gerekiyorsa önce Zod şeması ve ilgili UI mantığı güncellenmelidir.

## Doğrulama

Normal içerik değişiklikleri için değişen `.mdx` dosyalarını dikkatle gözden geçirmek yeterlidir. Şema, rotalar veya ortak veri mantığı değiştiyse daha güçlü bir proje kontrolü çalıştırın.
