---
title: Vuepress で生成したWebサイトを Now にデプロイしてみる
date: "2020-03-26"
---

## Vuepress とは
[Vuepress](https://vuepress.vuejs.org) とは Vue で作られた静的サイトジェネレータのこと。
静的サイトジェネレータといえば有名どころは
* [jekyll](https://jekyllrb-ja.github.io/)
* [Hugo](https://gohugo.io/)
などが挙げられる。
Vueで静的にサイトを作るのなら [Nuxt.js](https://nuxtjs.org/) でも良さそうにも思えるが、Vuepressは技術文書を静的に管理することに焦点を当て作成している。
[why-not](https://vuepress.vuejs.org/guide/#why-not)

### Vuepress インストール
下記コマンドでインストールできる。

```sh
$ npm install -g vuepress
```

### Vuepress を使ってみる
Vuepress は`README.md`を起点にサイトを生成するようになっている。
実際にどのように動作するか下記の`README.md`を作成して確認する。

```md
# h1
## h2
### h3
#### h4
##### h5
Headers

## List

* Item 1
* Item 2
* Item 3
 + Item 3-1
 + Item 3-2

## Link
[Vuepress](https://vuepress.vuejs.org)

```

`README.md`のあるディレクトリで下記コマンドで動作を確認できる。

```sh
$ vuepress dev
```

HTMLファイル等を生成するには下記コマンドを入力する。

```sh
$ vuepress build
```

## Now とは
[Now](https://zeit.co/now)とは簡単にWebアプリをデプロイできるサービスのこと。
CLIからコマンド一回でデプロイすることができる。
今回作成したサイトをさくっと公開するために使ってみる。
このデプロイの仕方は[Now公式](https://zeit.co/examples/vuepress/)でも書かれている。
[nowコマンドの使い方](https://jpn.now.sh/)

### nowコマンドをインストール・ログイン
nowにデプロイするために`now`コマンドをインストール

```sh
$ npm install -g now
```

次にNowを使うためにアカウントを登録する。
[サインアップ](https://zeit.co/signup)

登録が済んだら下記コマンドを入力しCLI上でログイン

```sh
$ now login
```

メールアドレスを入力した後に届くメールのリンクを踏めばログインは完了する。

### デプロイ
デプロイをするにはコードをNow側でビルドしてもらわないといけない。
なのでビルドできるように依存関係を書く必要がある
具体的には`README.md`を書いたディレクトリでVuepressをインストールする。

```sh
$ npm install vuepress --save-dev
```

次に下記内容の`package.json`を同じディレクトリに用意する。

```js
{
  "scripts": {
    "dev": "vuepress dev",
    "build": "vuepress build",
    "now-build": "npm build && mv .vuepress/dist dist"
  }
}

```

`dev`,`build`でvuepressのコマンドを呼べるようにしている他、`now-build`という項目を定義している。
`now-build`は`now`コマンドで静的サイトを公開する設定にしていると呼ばれる。
ここではvuepressで生成したファイルを`dist`ディレクトリに移すようにしている。

次に`now.json`というnowコマンドの設定ファイルを用意する

```js
{
  "version": 2,
  "name": "vuepress",
  "builds": [
    { "src": "package.json", "use": "@now/static-build" }
  ]
}
```

`version`はnowコマンドのバージョン。
`name`はデプロイする時に使用する名前。
`builds`はnowコマンドでデプロイする際、ビルドするかしないか、ビルドする際はどのように公開するかを定義する項目となっている。
`now.json`の詳細な解説は[ドキュメント](https://zeit.co/docs/v2/deployments/configuration)を参照すると良い。

これらを揃えた状態で下記コマンドを入力するとURLが出力される。

```sh
$ now
```

ビルドが無事に済めば下記のように公開される。
[https://vuepress.famasoon.now.sh/](https://vuepress.famasoon.now.sh/)
