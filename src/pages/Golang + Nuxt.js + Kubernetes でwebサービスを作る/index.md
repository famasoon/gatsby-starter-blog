---
title: Golang + Nuxt.js + Kubernetes でWebサービスを作る
date: "2019-10-12"
---

## Golang でAPIサーバを作る
Golang + Nuxt.js + Kubernetes でWebサービスを作るシリーズ第一弾。
まずはGolangでシンプルなAPIサーバを作成してみる。

今回はGETリクエストで渡されたドメインのwhois情報を取得するAPIサーバを書く。

APIサーバのソースコードはGitHubにアップロード済み
[https://github.com/famasoon/webapp-api](https://github.com/famasoon/webapp-api)

まずは適当なディレクトリを作る。
```bash
mkdir webapp-api
cd webapp-api
```

次にGoの依存関係を初期化。
```bash
GO111MODULE=on go mod init
```

今回はGo言語のEchoというモジュールでHTTPリクエストを、gowhoisでwhois関連の処理を行う。
必要なモジュールを`go get`で取得。
```bash
go get github.com/labstack/echo/...
go get -u github.com/famasoon/gowhois
```

下記の`main.go`でAPIサーバを書く。

```go
package main

import (
	"net/http"

	"github.com/famasoon/gowhois/whois"
	"github.com/labstack/echo"
)

type whoisInfo struct {
	Domain      string `json:"domain"`
	WhoisResult string `json:"result"`
}

func main() {
	e := echo.New()
	e.GET("/", func(c echo.Context) error {
		return c.String(http.StatusOK, "OK")
	})

	e.GET("/api/v1/whois/:domain", getWhoisResult)
	e.Logger.Fatal(e.Start(":8080"))
}

func getWhoisResult(c echo.Context) error {
	domain := c.Param("domain")
	result, err := whois.Whois(domain)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, whoisInfo{
		Domain:      domain,
		WhoisResult: result,
	})
}

```

APIサーバは本番環境と開発環境を一つのDockerfileで書く。
下記記事を参考にマルチステージ対応のDockerfileを書いた
https://qiita.com/po3rin/items/8b57e6c22f2b34751333

また、開発環境ではファイル更新の度にビルドし直すのが面倒なため、ホットリロードな環境を用意すべく`fresh`というモジュールを利用している。
`fresh`については下記記事を参考
https://qiita.com/po3rin/items/9acd41ef428436335c97

`Dockerfile`

```dockerfile
FROM golang:1.12 as builder
WORKDIR /go/api
COPY . .
ENV GO111MODULE=on
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo .

FROM alpine:latest as prod
EXPOSE 8080
WORKDIR /api
COPY --from=builder /go/api/ .
RUN pwd
CMD ["./webapp-api"]

FROM golang:1.12 as dev

EXPOSE 8080
WORKDIR /go/src/whoisapp
COPY . .
ENV GO111MODULE=on
RUN go get github.com/pilu/fresh
CMD ["fresh"]
```

`docker-compose`

```yaml
version: '3'
services:
  app:
    build: .
    volumes:
      - ./:/go/src/whoisapp
    ports:
      - "8080:8080"
```

開発環境と本番環境をビルドするための`Makefile`

```
all: dev prod

dev:
    docker build -t api-dev --target dev .

prod:
    docker build -t api-prod --target prod .
```


docker-composeの設定を書いておいたので実行。

```bash
docker-compose up
```

とりあえず`/api/v1/whois/:domain`にアクセスすると当該ドメインのwhois情報を取得するようになっている(使用しているライブラリの性質上、いくつかのドメインのwhois情報を取得できないが、それは一旦無視する)

[http://127.0.0.1:8080/api/v1/whois/example.com](http://127.0.0.1:8080/api/v1/whois/example.com) へアクセス。
`example.com`のwhois情報が取得できていればAPIサーバの完成。
次はこのDockerイメージをデプロイするためのKubernetesクラスタを作成する。

## GKEでKubernetesクラスタを作る
Golang + Nuxt.js + Kubernetes でWebサービスを作るシリーズ第二弾。
❶で作成したAPIサーバをGKEのKubernetesクラスタにデプロイする。

---

まずは安くGKEクラスタを作成しなくてはならない。
しかし安すぎると今度は却ってメモリ量が少なく、これからデプロイしようと思っているNuxt.jsのアプリケーションがデプロイできなくなる。
なのでメモリをたくさん積んだ`n1-standard-1`インスタンスで作成しようと思う。
まぁ、実際のサービスを作成するとなるとこの辺はもっと検討しないといけないところなのだが、そこは趣味ということで。
参考にしたのは下記リンク
[https://blog.a-know.me/entry/2018/06/17/220222](https://blog.a-know.me/entry/2018/06/17/220222)
わかりやすくGKEクラスタを作成する方法が書かれているので要参照。

まずはGKEクラスタを構築するためのインスタンス群を作成する

```bash
gcloud container clusters create webapp --preemptible --
machine-type n1-standard-1 --num-nodes=3 --disk-size=10
```

前回の記事で作成した本番環境用のイメージをGoogle Container Registryにアップロードするためにタグ付けを行う
```shell
docker tag api-prod gcr.io/[プロジェクト名]/[イメージ名]
:[バージョン名]
```

```bash
docker tag api-prod gcr.io/[プロジェクトID]/apiprod:1.0.0
gcloud auth configure-docker
docker push gcr.io/impactful-study-219313/apiprod:1.0.0
```

次に下記ymlファイルを用意してデプロイする


```yaml
apiVersion: v1
kind: Service
metadata:
  name: webappapi
  labels:
    run: webappapi
spec:
  selector:
    run: webappapi
  ports:
  - name: http
    port: 8080
  type: NodePort

---
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: webappapi
  labels:
    run: webappapi
spec:
  replicas: 3
  template:
    metadata:
      labels:
        run: webappapi
    spec:
      containers:
      - name: webappapi
        image: gcr.io/[プロジェクトID]/apiprod:1.0.0
        ports:
        - containerPort: 8080
      dnsPolicy: "None"
      dnsConfig:
        nameservers:
          - 1.1.1.1
```

ちなみにDockerコンテナからはDNSの名前解決ができないが`dnsConfig`の`nameservers`で名前解決の問い合わせ先を指定させることで名前解決を可能にしている。


グローバルIPを割与え、Ingressを使ってAPIサーバをインターネット越しに呼ぶようにする。
`ingress.yml`

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: ingress
spec:
  rules:
  - http:
      paths:
      - path: /api/*
        backend:
          serviceName: webappapi
          servicePort: 8080
```

```bash
kubectl apply -f ingress.yml
```

これでグローバルIPが割り振られる。
なおIPアドレスが割り振られたあと、しばらく(數十分ほど)待たないとアクセスできないので注意。
Ingressで取得されたグローバルIPアドレスを表示するには下記コマンドを打つこと。
```bash
kubectl get ingress
```

http://[Ingressで割り当てられたIPアドレス]/api/v1/whois/google.com
にアクセスしてWhois情報が表示されれば成功。

```bash
curl http://[IPアドレス]/api/v1/whois/example.com
{"domain":"example.com","result":"   Domain Name: EXAMPLE.COM\r\n   Registry Domain ID: 2336799_DOMAIN_COM-VRSN\r\n   Registrar WHOIS Server: whois.iana.org\r\n   Registrar URL: http://res-dom.iana.org\r\n   Updated Date: 2018-08-14T07:14:12Z\r\n   Creation Date: 1995-08-14T04:00:00Z\r\n   Registry Expiry Date: 2019-08-13T04:00:00Z\r\n   Registrar: RESERVED-Internet Assigned Numbers Authority\r\n   Registrar IANA ID: 376\r\n   Registrar Abuse Contact Email:\r\n   Registrar Abuse Contact Phone:\r\n   Domain Status: clientDeleteProhibited https://icann.org/epp#clientDeleteProhibited\r\n   Domain Status: clientTransferProhibited https://icann.org/epp#clientTransferProhibited\r\n   Domain Status: clientUpdateProhibited https://icann.org/epp#clientUpdateProhibited\r\n   Name Server: A.IANA-SERVERS.NET\r\n   Name Server: B.IANA-SERVERS.NET\r\n   DNSSEC: signedDelegation\r\n   DNSSEC DS Data: 31589 8 1 3490A6806D47F17A34C29E2CE80E8A999FFBE4BE\r\n   DNSSEC DS Data: 31589 8 2 CDE0D742D6998AA554A92D890F8184C698CFAC8A26FA59875A990C03E576343C\r\n   DNSSEC DS Data: 43547 8 1 B6225AB2CC613E0DCA7962BDC2342EA4F1B56083\r\n   DNSSEC DS Data: 43547 8 2 615A64233543F66F44D68933625B17497C89A70E858ED76A2145997EDF96A918\r\n   DNSSEC DS Data: 31406 8 1 189968811E6EBA862DD6C209F75623D8D9ED9142\r\n   DNSSEC DS Data: 31406 8 2 F78CF3344F72137235098ECBBD08947C2C9001C7F6A085A17F518B5D8F6B916D\r\n   URL of the ICANN Whois Inaccuracy Complaint Form: https://www.icann.org/wicf/\r\n\u003e\u003e\u003e Last update of whois database: 2019-08-04T01:55:52Z \u003c\u003c\u003c\r\n\r\nFor more information on Whois status codes, please visit https://icann.org/epp\r\n\r\nNOTICE: The expiration date displayed in this record is the date the\r\nregistrar's sponsorship of the domain name registration in the registry is\r\ncurrently set to expire. This date does not necessarily reflect the expiration\r\ndate of the domain name registrant's agreement with the sponsoring\r\nregistrar.  Users may consult the sponsoring registrar's Whois database to\r\nview the registrar's reported date of expiration for this registration.\r\n\r\nTERMS OF USE: You are not authorized to access or query our Whois\r\ndatabase through the use of electronic processes that are high-volume and\r\nautomated except as reasonably necessary to register domain names or\r\nmodify existing registrations; the Data in VeriSign Global Registry\r\nServices' (\"VeriSign\") Whois database is provided by VeriSign for\r\ninformation purposes only, and to assist persons in obtaining information\r\nabout or related to a domain name registration record. VeriSign does not\r\nguarantee its accuracy. By submitting a Whois query, you agree to abide\r\nby the following terms of use: You agree that you may use this Data only\r\nfor lawful purposes and that under no circumstances will you use this Data\r\nto: (1) allow, enable, or otherwise support the transmission of mass\r\nunsolicited, commercial advertising or solicitations via e-mail, telephone,\r\nor facsimile; or (2) enable high volume, automated, electronic processes\r\nthat apply to VeriSign (or its computer systems). The compilation,\r\nrepackaging, dissemination or other use of this Data is expressly\r\nprohibited without the prior written consent of VeriSign. You agree not to\r\nuse electronic processes that are automated and high-volume to access or\r\nquery the Whois database except as reasonably necessary to register\r\ndomain names or modify existing registrations. VeriSign reserves the right\r\nto restrict your access to the Whois database in its sole discretion to ensure\r\noperational stability.  VeriSign may restrict or terminate your access to the\r\nWhois database for failure to abide by these terms of use. VeriSign\r\nreserves the right to modify these terms at any time.\r\n\r\nThe Registry database contains ONLY .COM, .NET, .EDU domains and\r\nRegistrars.\r\n"}
```

## Nuxt.jsでフロントエンド作ってみる
Nuxt.jsでフロントエンドを実装する。

まずは下記コマンドでNuxtのプロジェクトを作成する。

```shell
$ npx create-nuxt-app webapp-front
> Generating Nuxt.js project in /Users/doejohn/work/sandbox/webapp-front
? Project name webapp-front
? Project description My wicked Nuxt.js project
? Use a custom server framework none
? Choose features to install Linter / Formatter, Prettier, Axios
? Use a custom UI framework buefy
? Use a custom test framework none
? Choose rendering mode Universal
? Author name famasoon
? Choose a package manager yarn
```

作成したプロジェクトのディレクトリに移動して試しにNuxtを動かしてみる。

```bash
$ cd webapp-front
$ yarn run dev
```

`http://localhost:3000`にアクセスするとこんな画面が出ると思う。
これをカスタマイズしていく。

![](https://i.imgur.com/EpQWx3B.png)

まずはバナー用の`Hero.vue`を`components`に追加する。

```html
<template>
  <section id="hero-section" class="hero is-medium is-primary is-bold">
    <div class="hero-body">
      <div class="container">
        <h1 class="title">
          <strong class="has-text-success">Welcome</strong> to Whois Query Web App
        </h1>
        <h2 class="subtitle">
          Show WHIOS information
        </h2>
      </div>
    </div>
  </section>
</template>
```

次にNuxtのレイアウトを決める`layouts/default.vue`を下記のように書き換える。

```html
<template>
  <div>
    <section class="main-content columns">
      <div class="container column is-10">
        <nuxt />
      </div>
    </section>
  </div>
</template>

```

`pages/index.vue`を書き換える。

```html
<template>
  <section class="section">
    <div class="columns is-mobile" />
    <hero />
    <div id="inputfield">
      <b-field position="is-centered">
        <b-input v-model="domain" placeholder="Input Domain or IP address..." type="search" icon="magnify" />
        <a :href="'/whois/' + domain">
          <p class="control">
            <button class="button is-info">
              Lookup
            </button>
          </p>
        </a>
      </b-field>
    </div>
    <description />
  </section>
</template>

<script>
import Hero from '~/components/Hero.vue'

export default {
  components: {
    Hero
  },
  data() {
    return {
      domain: ''
    }
  }
}
</script>

<style>
#inputfield {
  margin: 40px;
}
</style>

```
`yarn run dev`を実行し画像のように表示されれば問題なし。
![](https://i.imgur.com/1VjK8Oo.png)

次にAPIサーバの呼び出し先を本番環境と開発環境で変えるように設定する。
Nuxt.jsは環境変数で変数の内容を変えることができる。
参照: [env プロパティ](https://ja.nuxtjs.org/api/configuration-env/)
`nuxt.config.js`の`module.exports`に下記項目を追加

```js
env: {
    apiServer: process.env.API_SERVER || 'http://localhost:8080'
},
```

これで`API_SERVER`という環境変数が設定されている時はそちらをAPIサーバとして利用。
環境変数が設定されていない時は`http://localhost:8080`をAPIサーバとして利用するようにする。
後でDockerを使用し本番イメージを作る際に`API_SERVER`という環境変数をセットしておくと本番環境のAPIサーバを向くようになる。

次にWHOIS情報を表示するためのページを作成する。
`http://[webアプリ]/whois/[WHOISを表示したいドメイン]`といったURLで表示したい。
Nuxt.jsはpages配下のvueファイルを見て自動的にルーティングの設定をしてくれる。
動的なルーティングをする際はpages配下に`_`を先頭に付けたvueファイルを置けば良い。
参照: [Nuxt.js - 動的なルーティング](https://ja.nuxtjs.org/guide/routing/#%E5%8B%95%E7%9A%84%E3%81%AA%E3%83%AB%E3%83%BC%E3%83%86%E3%82%A3%E3%83%B3%E3%82%B0)
`pages/whois/_domain.vue`というファイルを下の内容で作成する。

```html
<template>
  <div>
    <h1 class="title">
      {{ $route.params.domain }}
    </h1>
    <h2 class="subtitle">
      Related information
    </h2>
    <div class="card">
      <header class="card-header">
        <p class="card-header-title">
          Whois Result
        </p>
        <a href="#" class="card-header-icon" aria-label="more options">
          <span class="icon">
            <i class="fas fa-angle-down" aria-hidden="true" />
          </span>
        </a>
      </header>
      <div class="card-content">
        <div class="content">
          <template>
            <pre>{{ whoisResp.result }}</pre>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  async asyncData(context) {
    const DOMAIN_NAME = context.params.domain
    const API_SERVER = process.env.apiServer
    const { data } = await axios.get(
      API_SERVER + '/api/v1/whois/' + DOMAIN_NAME
    )
    return {
      whoisResp: data
    }
  }
}
</script>
```

[❶参照](https://famasoon.hatenablog.com/entry/2019/08/03/163641)をしてローカルでAPIサーバを起動したら、
`http://127.0.0.1:3000`のフォームで`example.com`と入力し`Lookup`ボタンを押してみましょう。
`http://127.0.0.1:3000/whois/example.com`にルーティングされて下の画像のように表示されれば成功です。
![](https://i.imgur.com/WHSmlsK.png)

これでWHOIS情報をAPIサーバから取得して表示するWebアプリのフロントエンドが出来上がりました。
今回はここまで。
次回はフロントエンド部分をDockerイメージ化してGKEにデプロイしてみます。


## Nuxt.jsをGKEにデプロイ
フロントエンドのディレクトリに下記Dockerfileを追加
```dockerfile
FROM node:lts-alpine
WORKDIR /app
COPY . /app
ENV NODE_ENV=production
ENV API_SERVER 'http://[IPアドレス]'
ENV HOST 0.0.0.0
RUN yarn install
RUN yarn run build
EXPOSE 3000
CMD ["yarn", "run", "start"]
```

下記コマンドでlocalhostからアクセスできる
```sh
docker run -it -p 3000:3000 --network host --name dockerized-nuxt webappfront:latest
```

次にこのコンテナイメージをGoogle Container Registryにアップロードするためにタグ付けを行う

```sh
docker tag api-prod gcr.io/[プロジェクト名]/[イメージ名]
:[バージョン名]
```

アップロード

```sh
docker tag api-prod gcr.io/[プロジェクトID]/apiprod:1.0.0
gcloud auth configure-docker
docker push gcr.io/プロジェクト名]/[イメージ名]
:[バージョン名]
```

GKEにデプロイするためのymlファイル
```yml
apiVersion: v1
kind: Service
metadata:
  name: webappfront
  labels:
    run: webappfront
spec:
  selector:
    run: webappfront
  ports:
  - name: http
    port: 3000
  type: NodePort

---
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: webappfront
  labels:
    run: webappfront
spec:
  replicas: 3
  template:
    metadata:
      labels:
        run: webappfront
    spec:
      containers:
      - name: webappfront
        image: gcr.io//apiprod:1.0.0
        ports:
        - containerPort: 3000
```

下記コマンドでGKEに設定を反映
```sh
kubectl create -f webappfront.yml
```

ingress.ymlの中身を下記のように変更しルーティングを指せる

```yml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: ingress
spec:
  rules:
  - http:
      paths:
      - path: /api/*
        backend:
          serviceName: webappapi
          servicePort: 8080
      - path: /*
        backend:
          serviceName: webappfront
          servicePort: 3000
```

たぶんこれでうまくいく。
以上、Golang + Nuxt.js + KubernetesでWebサービスを作るでした。