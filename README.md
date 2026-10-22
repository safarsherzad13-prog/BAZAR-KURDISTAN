# BAZARA — وەشانی ئامادە بۆ Supabase + GitHub Pages

ئەمە پڕۆژەیەکی frontend ـە کە بە Supabase دەبەسترێتەوە. پێویستە خۆت پڕۆژەی Supabase دروست بکەیت و بەهاکانی config.js دابنێیت؛ من ناتوانم لەبری تۆ پڕۆژەیەک لە هەژماری Supabase ـت دروست بکەم یان کلیلە نهێنییەکانت دابین بکەم.

## فایلەکان
- `index.html` — پەڕەی سەرەکی، فۆڕمی هەژمار و ئیعلان
- `styles.css` — دیزاین بۆ مۆبایل و کۆمپیوتەر
- `app.js` — چوونەژوورەوە، خوێندنەوەی ئیعلان، زیادکردنی ئیعلان و داشبۆردی سەرەتایی
- `config.js` — شوێنی Project URL و anon/publishable key
- `supabase-setup.sql` — خشتەکان، RLS policies، trigger و storage bucket

## قۆناغی ١: دروستکردنی Supabase
1. بچۆ بۆ https://supabase.com/ و هەژمار دروست بکە یان بچۆ ژوورەوە.
2. پڕۆژەیەکی نوێ بە ناوی `BAZARA` دروست بکە و وشەی نهێنیی بەهێز بۆ داتابەیس دابنێ.
3. لە پڕۆژەکەت بچۆ بۆ **SQL Editor**.
4. فایلی `supabase-setup.sql` بکەرەوە، هەموو کۆدەکە کۆپی بکە، لە SQL Editor دایبنێ و **Run** بکە.
5. لە **Project Settings → API** (یان API Keys) ـەوە Project URL و `anon`/publishable key وەربگرە. تەنها ئەم کلیلە گشتییە لە frontend بەکاربهێنە؛ `service_role` key هەرگیز لە فایلەکانی وێبسایت دانەمەزرێنە.

## قۆناغی ٢: ڕێکخستنی config.js
فایلی `config.js` بکەرەوە و ئەم دوو بەهایە بگۆڕە:
- `PASTE_YOUR_SUPABASE_PROJECT_URL_HERE` ← Project URL
- `PASTE_YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY_HERE` ← anon/publishable key

پاشان فایلەکە پاشەکەوت بکە. هیچ کلیلێکی `service_role` یان وشەی نهێنی داتابەیس بڵاو مەکەرەوە.

## قۆناغی ٣: دروستکردنی هەژماری Owner
1. پێش بڵاوکردنەوە، لە Supabase → Authentication → URL Configuration، Site URL و دواتر Redirect URLs ـی وێبسایتەکەت زیاد بکە.
2. لە وێبسایتەکەدا هەژمار بە `safarsherzad13@gmail.com` دروست بکە. ئەگەر پشتڕاستکردنەوەی ئیمەیڵ چالاکە، ئیمەیڵەکەت پشتڕاست بکەرەوە و بچۆ ژوورەوە.
3. لە Supabase → SQL Editor ئەم کۆدە جێبەجێ بکە بۆ ئەوەی تەنها ئەو هەژمارە ببێتە Owner:

```sql
update public.profiles
set role = 'owner'
where lower(email) = lower('safarsherzad13@gmail.com');
```

4. دڵنیابە تەنها یەک ڕیز گۆڕدراوە. ئەگەر هیچ ڕیزێک نەگۆڕدرا، هەژمارەکە هێشتا لە `profiles` نییە یان ئیمەیڵەکە پشتڕاست نەکراوەتەوە؛ هەژمارەکە پشتڕاست بکەرەوە و کۆدەکە دووبارە جێبەجێ بکە.
5. لە وێبسایتەکە بچۆ دەرەوە و دووبارە بچۆ ژوورەوە. داشبۆردی Owner دەبێت بۆ ئەو هەژمارە پیشان بدرێت.

## قۆناغی ٤: بڵاوکردنەوە لە GitHub Pages
1. لە GitHub repository ـێکی نوێ دروست بکە.
2. فایلەکانی `index.html`, `styles.css`, `app.js`, `config.js` و `supabase-setup.sql` لە ڕەگی repository ـەکە دابنێ. `README.md` ـیش دەتوانیت زیاد بکەیت.
3. Commit changes بکە.
4. بچۆ **Settings → Pages**.
5. لە **Build and deployment**، Source هەڵبژێرە `Deploy from a branch`، branch ـەکە `main` و folder ـەکە `/(root)` هەڵبژێرە، پاشان Save بکە.
6. چەند خولەک چاوەڕێ بکە و لینکی GitHub Pages بکەرەوە.
7. لینکی وێبسایتەکەت لە Supabase → Authentication → URL Configuration زیاد بکە بۆ Site URL و Redirect URLs.

## قۆناغی ٥: تاقیکردنەوە
- بە هەژماری ئەندامێک تۆمار ببە و ئیعلانێک بنێرە.
- دڵنیابە ئیعلانەکە سەرەتا `pending` ـە و بۆ خەڵک نادیارە.
- بە Owner بچۆ ژوورەوە و ئیعلانەکە پەسەند بکە.
- لە پەڕەیەکی تر یان بەبێ چوونەژوورەوە بپشکنە ئیعلانە پەسەندکراوەکە دیارە.
- هەوڵ بدە بە ئەکاونتی ئەندام دەسەڵاتی Owner بەدەست بهێنیت؛ نابێت بتوانێت.

## پارەدان
پارەدانی ئۆنلاین لەم وەشانەدا هێشتا چالاک نییە. پێویستە providerێک هەڵبژێردرێت کە بازرگانییەکانی عێراق بە شێوەی یاسایی قبوڵ بکات، پاشان API، webhook، پشتڕاستکردنەوەی داواکاری و تاقیکردنەوەی پارەدان جێبەجێ بکرێن. تا ئەو کاتە بانگەشەی چالاکبوونی پارەدان مەکە.

## تێبینییەکانی پاراستن
- GitHub Pages تەنها فایلە گشتییەکان بڵاو دەکاتەوە؛ داتابەیس و هەژمار لە Supabase ـە.
- RLS لە SQL ـدا چالاکە. پێش بڵاوکردنەوە، policy ـەکان لە Supabase تاقی بکەرەوە.
- `anon/publishable key` دەتوانێت لە frontend بێت بە مەرجێک RLS دروست بێت. `service_role` key نابێت لە frontend بێت.
- Owner لە SQL ـەوە دەستنیشان دەکرێت؛ ئەندام ناتوانێت ڕۆڵی خۆی بگۆڕێت.
- ژمارە و ئیمەیڵ لە وێبسایتدا گشتی دەبن. ئەگەر ناتەوێت گشتی بن، پێش بڵاوکردنەوە بیگۆڕە.
