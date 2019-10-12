---
title: 10進数表記のIPアドレスでwebサイトにアクセスする
date: "2019-10-12"
---

## はじめに
なんとなくGitHubを漁っていたら面白そうなリポジトリを見つけた。

https://github.com/OsandaMalith/IPObfuscator
内容はIPアドレスを10進数や16進数、8進数に変換してwebサイトにアクセスするというもの。
バラバラの基数でも最終的にIPアドレスっぽくなればアクセスできるみたい。
そういえば[10進数のIPアドレス表記を利用する攻撃活動](https://blog.malwarebytes.com/cybercrime/2017/03/websites-compromised-decimal-ip-campaign/)もありましたね。
悪用ダメ絶対。

## 実装を見てみる
https://github.com/OsandaMalith/IPObfuscator/blob/master/ip.c
なるほど。
1バイトずつ読んで基数変換しているみたい。

## 実装してみた
なんとなくGo言語で実装してみた

https://github.com/famasoon/go-IPObfuscator

すごく可読性の低いコードになってしまったので後々、修正する。
正直あまり実用性はない。
出力方法も書いておく。

```bash
$ git clone https://github.com/famasoon/go-IPObfuscator
$ cd go-IPObfuscator
$ go run main.go
Enter IP Address: 222.165.163.91
http://3735397211
http://0xde.0xa5.0xa3.0x5b
http://0336.0245.0243.0133
http://0x00000000de.0x00000000a5.0x00000000a3.0x000000005b
http://00000000336.00000000245.00000000243.00000000133

http://0xde.0xa5.0xa3.91
http://0xde.0xa5.163.91
http://0xde.165.163.91

http://0336.0245.0243.91
http://0336.0245.163.91
http://0336.165.163.91

http://0xde.0xa5.41819
http://0336.0245.41819
http://0xde.0245.41819
http://0xde.10855259
http://0336.10855259
http://0xde.0xa5.0243.0133
http://0xde.0245.0243.0133
```

出力されたリンクを踏むとGoogle に飛ぶ。
結構、見た目を変えてもアクセスできるので奥が深い。
おわり