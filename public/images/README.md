# Pusula — Görsel Varlıklar (`public/images/`)

Marka görselleri ve sosyal medya varlıkları. Tümü Pusula (YKS koçluk) marka kimliğini taşır: lacivert `#1e3a5f`/`#2d5a87` gradyan + kırmızı aksan `#e63946`/`#c1121f`.

| Dosya | Boyut | Açıklama |
|-------|-------|----------|
| `favicon.svg` | 100x100 | Tarayıcı sekme ikonu (P gradyan). |
| `og-image.svg` | 1200x630 | Open Graph / sosyal paylaşım kaynağı (vektör). |
| `og-image.png` | 1200x630 | `og-image.svg` dosyasından `magick` ile rasterize edilmiş OG görseli. `index.html` `og:image` olarak işaretlenir. |
| `logo.svg` | 256x256 | Kare marka logosu (favicon'daki "P" gradyan teması). |
| `logo-white.svg` | — | Beyaz varyant (koyu zeminler için). |
| `404-illustration.svg` | 200x200 | 404 sayfası dekoratif pusula illüstrasyonu. |
| `404.svg` | 400x300 | 404 sayfası tam görseli (metinli). |

## og-image.png üretimi

```bash
magick og-image.svg -background none -resize 1200x630 og-image.png
```

Sistemde `convert`/`magick` (ImageMagick) mevcut olduğu için PNG başarıyla üretilmiştir.
