---
title: Tor Hidden Service でウェブサイトを公開してみる
date: "2019-10-12"
---

# まえがき
[ダークウェブについて](http://sh1ttykids.hateblo.jp/entry/2017/11/19/110026)
という記事を読んだ。
内容はダークウェブ、主にTor Hidden Service(以下 "HS")に的を絞って解説しているものだ。
HSについては先の記事でも書かれているようにTor Bundle Browserを用いれば簡単にアクセスが可能。
有名なHSは[Facebook](https://facebookcorewwwi.onion)や[The New York Times](https://www.nytimes3xbfgragh.onion)が挙げられる。
さて、そんなHSだがアクセスするだけでなくサイトの開設も簡単だったりする。
自分でサーバをたててサイトを開いたことがあれば誰でもできるような内容だ。
早速やってみるとしよう。

# 環境

```bash
$ uname -a
Linux instance-2 4.10.0-40-generic #44~16.04.1-Ubuntu SMP Thu Nov 9 15:37:44 UTC 2017 x86_64 x86_64 x86_64 GNU/Linux
$ lsb_release -a
No LSB modules are available.
Distributor ID: Ubuntu
Description:    Ubuntu 16.04.3 LTS
Release:        16.04
Codename:       xenial
```

# Tor のセッティング
何はともあれ Tor をインストールしなければ始まらない。
Ubuntu 16.04 では apt で簡単にインストールできる。

```bash
$ sudo apt install tor
$ sudo systemctl start tor
```

Tor 公式ドキュメントである
https://www.torproject.org/docs/tor-onion-service
を読めばわかるがtorrcの設定を変更しHSのアドレスとソレに対応した秘密鍵を生成する。
torrcは"/etc/tor/torrc"にあると思う。
生成されたファイルは"HiddenServiceDir"に書かれているディレクトリに吐かれる。
"HiddenServicePort"には接続したいポートを書けば良い。
リバースプロキシとかポートフォワーディングとか想像すればわかりやすいと思う。
"HiddenServiceDir", "HiddenServicePort"ともにコメントアウトされていると思うので、それらを参考に書くと良いだろう。
これで生成されたHSのアドレスを確認できる。
(ディレクトリは"HiddenServiceDir"で設定したものを指定する)

```bash
$ sudo cat /var/lib/tor/hidden_service/hostname
bdenpuomrxulax2d.onion
```

# nginx のセッティング
アドレスや鍵を生成してもwebサーバが稼働していないので当然ながらアクセスできない。
ここではnginxを利用してアクセス可能な状態までもっていく。
まずはnginxのインストール。

```bash
$ sudo apt install nginx
```

サイトのファイルを作成し、nginxから読み取れるようにパーミッションを変更。

```bash
$ sudo mkdir /var/www/onion/
$ echo "Hello Onion :)" | sudo tee /var/www/onion/index.html
Hello Onion :)
$ sudo chown -R www-data:www-data /var/www/onion/
```

次にnginxを設定する。
今回は"/etc/nginx/conf.d/onion.conf"にHSの設定を書く。
(server_nameは各自置き換えること)

```
server {
    server_name bdenpuomrxulax2d.onion;
    root /var/www/onion/;
}
```

そしてnginxを再起動
```bash
$ sudo systemctl restart nginx
```

# 実際に開いてみる
![](https://i.imgur.com/eQp8K5M.png)
できた。
ちなみにこのやり方だとホストを指定しなければHS用のwebサイトが表示されない。
つまりShodanやCensysのようなIPアドレスを指定するタイプのスキャナーではHSの情報がリークしない。


# おわりに
という訳でHSを開設した。

# 連絡
何かあったらTwitterまで連絡ください
https://twitter.com/FAMASoon
