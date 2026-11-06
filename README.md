# European E-commerce Report 2026 – český souhrn

Interní jednostránkový souhrn reportu *European E-commerce Report 2026* (Ecommerce Europe, EuroCommerce, CMI / Amsterdam University of Applied Sciences) pro produktové a projektové oddělení. Stránka je dostupná jen po zadání přístupového kódu.

## Struktura

```
public/               statický web (Vercel ho servíruje jako výstup)
  index.html          souhrn – inline CSS + JS, bez externích závislostí
  login.html          vstupní stránka s polem pro kód
  img/                titulní foto a portrét z reportu
middleware.js         Vercel Routing Middleware – bez platné session cookie přesměruje na /login
api/login.js          ověří kód proti env ACCESS_CODE, nastaví podepsanou HttpOnly cookie (30 dní)
api/logout.js         smaže cookie
lib/auth.js           sdílená logika (HMAC-SHA256 token, porovnání v konstantním čase)
```

Ochrana běží na serveru: bez cookie se nevydá HTML ani obrázky. Zdrojové PDF (`inputs/`) se do repozitáře nedává – licence vydavatele nedovoluje jeho šíření. Tlačítko „Stáhnout“ proto vede na oficiální PDF na eurocommerce.eu.

## Proměnné prostředí (Vercel → Project → Settings → Environment Variables)

| Proměnná | Povinná | Popis |
|---|---|---|
| `ACCESS_CODE` | ano | Přístupový kód. Když chybí, je web zamčený pro všechny. |
| `SESSION_SECRET` | doporučená | Libovolný dlouhý náhodný řetězec. Jeho změnou (nebo změnou kódu) se odhlásí všichni. |

Po změně proměnných je potřeba udělat nový deploy (Redeploy).

## Lokální vývoj

```bash
cp .env.example .env.local   # nastavte testovací ACCESS_CODE
vercel dev
```

## Nasazení

1. Repozitář v organizaci Praguebest na GitHubu → Vercel → *Add New Project* → import repozitáře.
2. Framework Preset: **Other**, Build Command prázdný, Output Directory `public`.
3. Nastavit `ACCESS_CODE` (a `SESSION_SECRET`) pro Production i Preview.
4. Deploy. Každý push do `main` se nasadí automaticky.

## Aktualizace obsahu

Data jsou v `public/index.html` v bloku `/* ---------- data z reportu ---------- */` (konstanty `TURNOVER`, `REGIONS`, `M`, `CZ`, `CEE`). Texty jsou přímo v HTML. Česká typografie: pevné mezery za jednopísmennými předložkami a mezi číslem a jednotkou, slova jako `e-commerce` obalit do `<span class="nw">`.

Pozn.: Report uvádí pro Česko HDP shodné s Rakouskem (s. 56 a 59), takže E-GDP a HDP na obyvatele ČR jsou v reportu pravděpodobně chybné. Stránka na to upozorňuje.
