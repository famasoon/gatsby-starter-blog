---
title: DockerとGolangでAPIサーバを立てる
date: "2020-03-26"
---

サンプルは[ここ](https://github.com/famasoon/apidocker)。
まずはGoで簡単なAPIサーバを立てる。
今回はサクッとAPIサーバを作れる[echo](https://echo.labstack.com/)を使う。
まずはメインのサーバ。

```go:server.go
package main

import (
	"godocker/api"
	"net/http"

	"github.com/labstack/echo"
)

func main() {
	e := echo.New()
	e.GET("/", func(c echo.Context) error {
		return c.String(http.StatusOK, "Hello, world")
	})

	e.GET("/api", func(c echo.Context) error {
		return c.String(http.StatusOK, api.GetApi())
	})

	e.Logger.Fatal(e.Start(":1323"))
}

```

同じパッケージでAPIを書くのは避けたい。
そういう訳でAPIの部分はディレクトリを分けて作る。

```go:api/api.go
package api

func GetApi() string {
	return "GetApi"
}

```

このAPIサーバをDockerコンテナにする。
とりあえずDockerfile

```docker:Dockerfile
FROM golang:latest

WORKDIR /go/src/godocker

COPY . .

RUN go get -d -v ./...
RUN go install -v ./...

CMD ["godocker"]
```

ビルドしてコンテナを走らせてみる。

```sh
$ docker build -t echo .
$ docker run --rm -p 127.0.0.1:1323:1323 --name echo echo
```

実行できているか確認

```sh
$ curl 127.0.0.1:1323
$ curl 127.0.0.1:1323/api
```

"Hello, world"と"GetApi"が帰ってきたら成功。
あとは同じ要領でAPI生やそう。
