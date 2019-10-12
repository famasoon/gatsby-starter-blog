---
title: Ingressのヘルスチェックに対応する
date: "2019-10-12"
---

## tl;dr
- "/"パスへのHTTPリクエストに対し200ステータスを返すように実装すればよい

## Ingress のヘルスチェック
GKEでIngressを使っていた所ヘルスチェックをうまく通過しない。
色々と調べたところIngressのヘルスチェックはreadinessProbe.httpGetを指定しないと、デフォルトでは"/"パスにHTTP GETリクエストを送信し200ステータスが帰ってこない場合は対象ポッドが動作していないとみなすみたい。
[https://github.com/kubernetes/ingress-gce/issues/42](https://github.com/kubernetes/ingress-gce/issues/42)

readinessProbe.httpGetを指定しても別に良かったが、"/"パスは使っていないし、どうせヘルスチェック用にyamlを書き足しAPIのエンドポイントを作るのだったら、"/"へのリクエストに200返すようなコードを書いておけばいいだろうと思い、下記のGolangコードをエンドポイントに追加して対応した。

```go
package main

import (
	"net/http"

	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
)

func main() {
	e := echo.New()

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	e.GET("/", func(c echo.Context) error {
		return c.String(http.StatusOK, "OK")
	})

	e.Logger.Fatal(e.Start(":8080"))
}
```

## 参考
Ingressというよりk8sの話だが、ヘルスチェックについては下記ドキュメントが参考になった
- [https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/)
- [https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)