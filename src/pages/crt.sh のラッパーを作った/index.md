---
title: ctt.shのラッパを作った
date: "2019-11-26"
---

crt.shのラッパつくる
===

## 概要
[crt.sh](https://crt.sh)からCTログを引っ張ってきて出力する。
CTログのクエリの仕方を変えるだけでフィッシングサイトとかが簡単に見つかる。

### CTとは
Googleが提唱している証明書の透明性を高める取り組み・プロジェクト。
証明書の発行を誰もがほぼリアルタイムで監視・監査することで、認証局によって誤って発行されたSSL証明書の発見や、悪意を持って発行された証明書とそれを発行した認証局の特定を可能にする。
たまにCTログの中に内部のドメインとかが入っているためOSINT大好きマンにはよく利用されている。


#### 参照
[Certificate Transparency](https://www.certificate-transparency.org/)
[JNSAの資料(PDF)](https://www.jnsa.org/seminar/pki-day/2016/data/1-2_oosumi.pdf)

## 実際にCTログを見てみる
まずはcrt.shからjsonで情報を出力する。
といっても
`https://crt.sh/?q=` + `<domain>` + `&output=json`
でGETリクエストを出すだけ。

```sh
$ curl 'https://crt.sh/?q=example.com&output=json' | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  2163  100  2163    0     0   1635      0  0:00:01  0:00:01 --:--:--  1636
[
  {
    "issuer_ca_id": 1191,
    "issuer_name": "C=US, O=DigiCert Inc, CN=DigiCert SHA2 Secure Server CA",
    "name_value": "example.com",
    "min_cert_id": 987119772,
    "min_entry_timestamp": "2018-11-29T13:44:14.118",
    "not_before": "2018-11-28T00:00:00",
    "not_after": "2020-12-02T12:00:00"
  },
  {
    "issuer_ca_id": 1191,
    "issuer_name": "C=US, O=DigiCert Inc, CN=DigiCert SHA2 Secure Server CA",
    "name_value": "example.com",
    "min_cert_id": 984858191,
    "min_entry_timestamp": "2018-11-28T21:20:12.606",
    "not_before": "2018-11-28T00:00:00",
    "not_after": "2020-12-02T12:00:00"
  },
  {
    "issuer_ca_id": 1465,
    "issuer_name": "C=US, O=\"thawte, Inc.\", CN=thawte SSL CA - G2",
    "name_value": "example.com",
    "min_cert_id": 24564717,
    "min_entry_timestamp": "2016-07-14T07:55:01.55",
    "not_before": "2016-07-14T00:00:00",
    "not_after": "2017-07-14T23:59:59"
  },
  {
    "issuer_ca_id": 1465,
    "issuer_name": "C=US, O=\"thawte, Inc.\", CN=thawte SSL CA - G2",
    "name_value": "example.com",
    "min_cert_id": 24560643,
    "min_entry_timestamp": "2016-07-14T07:30:08.461",
    "not_before": "2016-07-14T00:00:00",
    "not_after": "2018-07-14T23:59:59"
  },
  {
    "issuer_ca_id": 1465,
    "issuer_name": "C=US, O=\"thawte, Inc.\", CN=thawte SSL CA - G2",
    "name_value": "example.com",
    "min_cert_id": 24560621,
    "min_entry_timestamp": "2016-07-14T07:25:01.93",
    "not_before": "2016-07-14T00:00:00",
    "not_after": "2017-07-14T23:59:59"
  },
  {
    "issuer_ca_id": 1449,
    "issuer_name": "C=US, O=Symantec Corporation, OU=Symantec Trust Network, CN=Symantec Class 3 Secure Server CA - G4",
    "name_value": "example.com",
    "min_cert_id": 24558997,
    "min_entry_timestamp": "2016-07-14T06:40:02.4",
    "not_before": "2016-07-14T00:00:00",
    "not_after": "2018-07-14T23:59:59"
  },
  {
    "issuer_ca_id": 1397,
    "issuer_name": "C=US, O=DigiCert Inc, OU=www.digicert.com, CN=DigiCert SHA2 High Assurance Server CA",
    "name_value": "example.com",
    "min_cert_id": 10557607,
    "min_entry_timestamp": "2015-11-05T14:51:33.941",
    "not_before": "2015-11-03T00:00:00",
    "not_after": "2018-11-28T12:00:00"
  },
  {
    "issuer_ca_id": 1397,
    "issuer_name": "C=US, O=DigiCert Inc, OU=www.digicert.com, CN=DigiCert SHA2 High Assurance Server CA",
    "name_value": "example.com",
    "min_cert_id": 5857507,
    "min_entry_timestamp": "2014-12-11T14:36:57.201",
    "not_before": "2014-11-06T00:00:00",
    "not_after": "2015-11-13T12:00:00"
  }
]
```

### 参照
[PythonのAPIラッパ実装](https://github.com/PaulSec/crt.sh)

## 作った
[https://github.com/famasoon/crtsh](https://github.com/famasoon/crtsh)
クエリをかけたり証明書の中身から登録されているDNS情報を引き出せる。(悪用ダメ絶対)
機能自体はGo言語の標準ライブラリのみで実装しているので特に依存関係とか気にせず使用可能。
[https://crt.sh](https://crt.sh)自体がクエリにワイルドカード(`%`やら`_`)に対応しているのでクエリをかけるのが楽。
今は証明書からDNS情報のみ引き出せるが将来的にはより多くの情報を引き抜くようにしていきたい。

### 余談
[https://crt.sh](https://crt.sh)では`_`を使った検索が可能である。
内容としては一部一致しているドメインの証明書を引っ張ってこれる。
これはうまく使うとフィッシング詐欺系サイト(特にドメインを似せてきていたり、タイポスワッティングを狙っているサイト)を大量に引っ掛けられそうである。
今回はそこまでしないが、今度うまくいったら報告する予定。

以上です。