---
title: OpenFaas で function を自作する
date: "2020-03-26"
---

# OpenFaas で function を自作する
OpenFaas で function を実装してデプロイしてみる。
OpenFaas のセットアップについては[こちら](https://qiita.com/FAMASoon/items/bfd1d18ef695415a8d9b)

## function をビルドする
下記コマンドで function の実装ができる

```sh
$ faas-cli new --lang <実装したい言語> <functionの名前>
```

今回は入力されたドメインの whois 情報を出力する function を Golang で実装してみる。
faas-cli で function を作成すると諸々の設定ファイルや function を実装するためのファイルが生成される。

```sh
$ faas-cli new --lang go whois
$ ls
template whois whois.yml
```

### ファイルの中身を確認する
`whois.yml` ファイルには実装する function に関する設定が書かれている。

```yml
provider:
  name: faas
  gateway: http://127.0.0.1:8080
functions:
  whois:
    lang: go
    handler: ./whois
    image: whois:latest
```

`whois/handler.go` ファイルには function の処理が書かれている。

```go
package function

import (
	"fmt"
)

// Handle a serverless request
func Handle(req []byte) string {
	return fmt.Sprintf("Hello, Go. You said: %s", string(req))
}

```

試しにデプロイして動かす。

```sh
$ faas-cli build -f ./whois.yml
$ faas-cli deploy -f ./whois.yml
$ curl -X POST -d "test" http://127.0.0.1:8080/function/whois
Hello, Go. You said: test
```

## function を実装する
前述した`whois/handler.go`を書き換える事で function を実装できる。
しかし、今回はGoの標準ライブラリだけでなくwhois結果を問い合わせる[undiabler/golang-whois](https://github.com/undiabler/golang-whois) も使いたい。
依存関係を解決するために [dep](https://github.com/golang/dep) を使用する。

```sh
$ cd whois
$ dep init
$ dep ensure -add https://github.com/undiabler/golang-whois
$ cd ..
```

これで vender ディレクトリの下に github.com/undiabler/golang-whois がダウンロードされた。
では次に肝心の function を実装する。
`whois/handler.go` を下の通りに書き換える。

```go
package function

import (
	"github.com/undiabler/golang-whois"
)

// Handle a serverless request
func Handle(req []byte) string {
	result, err := whois.GetWhois(string(req))
	if err != nil {
		panic(err)
	}

	return result
}

```

function の中身を描いた上でデプロイしてみる。

```sh
$ faas-cli build -f ./whois.yml
$ faas-cli deploy -f ./whois.yml
```

うまくデプロイされているか確かめるため、試しに`example.com`のwhois情報を出力させてみる。

```sh
$ curl -X POST -d "example.com" http://127.0.0.1:8080/function/whois
```

whois の結果が出力されたと思う。

## まとめ
OpenFaas で function の実装まで行った。
簡単に function 実装できる OpenFaas すごい。
