---
title: Extract Windows KB
date: "2020-03-15"
---

手順
===

## Windows Updateのセキュリティパッチから差分を撮ってみる
1. 問題となっているCVE番号で https://portal.msrc.microsoft.com/en-us/security-guidance を調べる(今回例としてはCVE-2019-0786について)
2. 当該脆弱性のアドバイザリがあればそれを開く
https://portal.msrc.microsoft.com/ja-JP/security-guidance/advisory/CVE-2019-0786
3. "Secuirty Update"から回答のアップデートをダウンロード
4. msuファイルをダウンロード

---

- ダウンロードしたmすふぁいるを展開する

```
wusa.exe C:\installl.msu /extract:c:\test\
```

または

```
expand /f:* C:\install.msu C:\test\
```

---

- msuファイルを展開して出てきたcabファイルを更に展開

```
expand -F:* update.cab C:<target_dir>
```

---

- Ghidraで差分を確認
- Ghidra Pro book に載っているので要参照

終わり