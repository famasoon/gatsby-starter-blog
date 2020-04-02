---
title: OpenFaas をセットアップして function を呼び出す
date: "2020-03-26"
---

# OpenFaas をセットアップして function を呼び出す
AWS lambda を何となく触ってみて、ベンダロックインしない形で同じような機能を実現できないかなと思って色々と調べているとOpenFaasというOSSを見つけた。
AWS lambda とAPI Gatewayをまとめた感じの処理をdockerを使って実現するプロジェクトのようだ。
試しに触ってみたのでその記録を書く。

## OpenFaas とは
Serverless な処理を Docker や Kubernetes で実装するためのフレームワーク。
公式で日本語化されたチュートリアルがある
[link](https://github.com/openfaas/workshop/tree/master/translations/ja#openfaas%E3%83%AF%E3%83%BC%E3%82%AF%E3%82%B7%E3%83%A7%E3%83%83%E3%83%97)

## OpenFaas のセットアップ
必要なソフトは下記の通り

* Docker

まずは OpenFaas を動かすための swarm をセットアップ

```sh
$ docker swarm init
```

### openfaas-cli のインストール
次に OpenFaas を動かすためのCLIコマンドをインストールする。
ここでインストールするfaas-cliを使用すればCLIからfunctionの新規作成、ビルド、デプロイ等の操作ができるようになる。
mac環境なら以下のコマンドでインストール

```sh
$ brew install faas-cli
```

Linux とかの環境なら下記のコマンドでインストール

```sh
$ curl -sL cli.openfaas.com | sudo sh
```

インストールされたか確認

```sh
$ faas-cli version
```

### OpenFaasのデプロイ
GitHub から最新版の OpenFaas をダウンロードして Docker swarm で起動させる。

```sh
$ git clone https://github.com/openfaas/faas
$ cd faas
$ git checkout master
$ ./deploy_stack.sh --no-auth
```

## OpenFaas で function を動かす
試しにいくつか function をデプロイしてみる。

```sh
$ faas-cli deploy -f https://raw.githubusercontent.com/openfaas/faas/master/stack.yml
```

デプロイした function が動いているか確認する。
function を呼び出す時は下記コマンドのようにinvoke オプションを付けて function 名を書き実行する。

```sh
$ faas-cli invoke <function名>
```

function は標準入力を読み込んで標準出力に結果を出すようになっている。
今回はmarkdownをHTMLに変換するmarkdown functionを試す。
以下はechoでmarkdown形式の入力をfaas-cliでfunctionに読み込ませている。

```sh
$ echo "## The **OpenFaaS** _workshop_" | faas-cli invoke markdown
<h2>The <strong>OpenFaaS</strong> <em>workshop</em></h2>
```

markdownがHTMLに変換されて出力されている。
web経由でも呼び出せる(というかこっちが本来の使い方？)
curlを使った例

```sh
$ curl -X POST -d "## The **OpenFaaS** _workshop_" http://127.0.0.1:8080/function/markdown
<h2>The <strong>OpenFaaS</strong> <em>workshop</em></h2>
```

## まとめ
とりあえず OpenFaas をセットアップして function を呼び出すところまでやってみた。
次回は function を実装してデプロイしてみる。
