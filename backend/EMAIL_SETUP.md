# Transakční e-maily

Backend používá vestavěné `smtplib`; není potřeba instalovat další balíček. Doručování se aktivuje až po nastavení proměnných prostředí v Renderu (a lokálně v backend/.env):

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=uzivatel
SMTP_PASSWORD=heslo_aplikace
SMTP_USE_TLS=true
SMTP_USE_SSL=false
MAIL_FROM=InEveryUnivers <noreply@example.com>
```

Pro SSL na portu 465 nastav `SMTP_USE_SSL=true` a `SMTP_USE_TLS=false`. Hesla ani API klíče neposílej do chatu ani do ZIPu; vlož je přímo do Render Environment. Bez SMTP nastavení aplikace normálně funguje a e-maily se pouze přeskočí.

Aktuálně se posílá uvítací e-mail po registraci, potvrzení přijetí hlášení a e-mail při převzetí / vyřešení / zamítnutí hlášení. E-maily neobsahují text soukromých zpráv. Odpovídající interní upozornění se ukládají do účtu. Ověřování e-mailu při registraci zůstává vypnuté pro vývojové prostředí.
