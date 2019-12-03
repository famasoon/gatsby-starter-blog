---
title: 証明書の発行されたTor Hidden Serviceを探してみた
date: "2019-12-03"
---

##  Tor Hidden Serviceとは
Tor Hidden Service(以下 "HS")とは強固な匿名性を確保するツール[Tor](https://www.torproject.org/)を用いないとアクセスできないサービスのこと。
末尾が`.onion`で終わるドメイン名を持つ。
Tor は端末のIPアドレスを隠すことでサービス提供者の匿名性を向上させるツール。
SOCKSプロキシとして動作するため、SOCKSプロトコルのプロキシが対応していればHS自体は別にHTTPサーバでもメールでもSSHでも使える。

例: [自宅のラズパイを Tor Onion Service にして外から SSH 接続する](https://qiita.com/legokichi/items/d3fb4503c99b80ada25c)


## Tor Hidden Service と証明書
さて、HSはTor Bundle Browser を用いれば簡単にアクセスが可能だ。
有名なHSは[Facebook](https://facebookcorewwwi.onion)や[The New York Times](https://www.nytimes3xbfgragh.onion)が挙げられる。
ここで気になるのが、これらHSがHTTPSを使っていることだ。


`https://facebookcorewwwi.onion`
`https://www.nytimes3xbfgragh.onion`

[Facebook, hidden services, and https certs](https://blog.torproject.org/facebook-hidden-services-and-https-certs)


上記リンクを参照してもらうとわかる通りHSでも証明書は使える(色々と議論が盛り上がったようだが...)


「どうせE2Eで暗号化されているし、PGPなり何なりの署名で検証できるしHTTPSの証明書いるか？」と思う部分もあるものの、表立って活動している企業や団体がHSでサッとなりすましではないことをを示すのには便利なのだろう。

そんな事情もあって一部HSでHTTPSが使われているが、このHTTPS通信で使用する証明書も例外なくCertificate Transparency(以下"CT")のログを残している。

ここでこんな考えが出てくる。


「もしかしてCTログを漁ればHTTPSのHSと紐づいている他のHSやサーバの情報を確認できるのでは？」


「✝️闇✝️のサービスのCTログとか発見して、それを元に色々と情報を確認できるのでは？」


と言うわけで早速[crt.sh](https://crt.sh)で`.onion`ドメインと紐づいている証明書を探してみた。


## crt.sh でクエリかけてみた
とりあえず`%.onion`でクエリをかけてみた。


[https://crt.sh/?q=%25.onion](https://crt.sh/?q=%25.onion)

めっちゃヒットするじゃん...


自作したcrt.shでクエリかけるツールでドメインを洗い出してみた.


[自作したツール: crtsh](https://github.com/famasoon/crtsh)

```sh
$ ./crtsh -q %.onion -o | sort | uniq
```

結果はこちら
[gist](https://gist.github.com/famasoon/1dd9b1734fe63ed7efcfe04b6311f052)

パッと見た感じ普通の企業やら団体ばかりという感じ。
前述した通り「どうせE2Eで暗号化されているし、PGPなり何なりの署名で検証できるしHTTPSの証明書いるか？」と思っている人が存在している中で、企業でも何でもない人が証明書を取得するメリットがない。
証明書発行にはコストがかかるし、認証局に色々と情報を渡さないといけない。
そして何よりHSで大きいトラフィックを抱えているような✝️闇✝️のサービスなんかはそもそも証明書が発行されないだろう(推測)


## まとめ
証明書の発行されたTor Hidden Serviceを探してみた結果をまとめると以下の通りだ。

- HSであろうともHTTPSの証明書を発行されている場合は例外なくCTログを残している
- `.onion`ドメインのCTログを漁っても普通の企業や団体ばかりがヒットする
- ✝️闇✝️のサービスのOSINTにはあまり使えなさそう...


また何か✝️闇✝️のサービスのOSINTに使えそうなテクニックを思いついたら書く予定。
以上。