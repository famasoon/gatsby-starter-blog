---
title: Serverless Framework でHello world
date: "2020-03-26"
---

## 概要
Serverless Framework とはサーバレスなアプリケーションを作成、デプロイが簡単にできるツール。
AWS Lambda や Google Cloud Functions といったFaasの実装や、API Gateway の構成変更が容易にできる。
今回はAPI Gateway経由でAWS Lambdaを呼び出してみる。

## 環境構築
### インストール
まずは Serverless Frameworkをインストール。

```sh
$ npm install serverless -g
```

インストールが完了したらデプロイする際に必要なAWSのユーザ情報を作成する。

### IAMユーザの作成・登録
Serverless Framework をAWSで利用するには色々と権限を付与したユーザを用意する必要がある。
公式で[セットアップ手順](https://serverless.com/framework/docs/providers/aws/guide/credentials/)が記載されているのでその通りにユーザを作成する。

1. [AWSのIAM管理コンソール](https://console.aws.amazon.com/iam/home#/users)を開く
2. "ユーザを追加"をクリックする
3. 適当にユーザ名を入力する。ここでは"serverless-agent"とする。
3. "プログラムによるアクセス"にチェックボックスを入れ"次のステップ"をクリック
4. "既存のポリシーを直接アタッチ"から"ポリシーの作成を選択"
5. JSONをクリックし[公式で案内しているgist](https://gist.github.com/ServerlessBot/7618156b8671840a539f405dea2704c8)から内容をコピペして上書き
6. ポリシーの確認をクリック
7. 適当にポリシー名を入力する。ここでは"serverless-agent-policy"とする。入力したらポリシーの作成をクリック。
8. ポリシーが作成されたらユーザを追加の画面に戻ってポリシーをリロード
9. ポリシーから"serverless-agent-policy"を選択して"次のステップ"をクリック
10. 次のステップ: 確認をクリック
11. ユーザの作成をクリック
12. ユーザの作成が成功したらアクセスキーIDとシークレットアクセスキーが表示されるので下記コマンドで Serverless Framework にユーザ情報を登録する。

```sh
$ serverless config credentials --provider aws --key <アクセスキーID> --secret <シークレットアクセスキー>
```

これで Serverless Frameworkからサーバレスアプリケーションをデプロイするための準備ができた。

## アプリケーションの作成
今回はPython 3.7 でアプリケーション(といっても中身はHello world)を作る。
Serverless Framework は`sls`という短いコマンドから操作できるので、これを用いてアプリケーションを実装していく。

まずはサーバレスアプリケーションのプロジェクト作成。

```sh
$ sls create -t aws-python -p helloWorld
```

`create`オプションでプロジェクトを作成。
`-t`は`--template`の略でどの言語で実装するかを選択するオプション。
今回はPython を選択。
[使用できる言語の一覧](https://serverless.com/framework/docs/providers/aws/examples/hello-world/)

`-p`は`--path`の略でプロジェクトのパス名を指定するオプション。

`helloWorld`ディレクトリが作成されたら中を見てみる。
`serverless.yml`にはアプリケーションの構成情報が定義されている。

```yml
service: aws-python3

provider:
  name: aws
  runtime: python3.7

functions:
  hello:
    handler: handler.hello
```

`handler.py`には`serverless.yml`で指定した`hello`関数が定義されている。
中身は入力内容をそのままjsonとして返すコードになっている。

```py
import json


def hello(event, context):
    body = {
        "message": "Go Serverless v1.0! Your function executed successfully!",
        "input": event
    }

    response = {
        "statusCode": 200,
        "body": json.dumps(body)
    }

    return response
```

## Lambdaの実装を書き換えてみる
`handler.py`の中身を下記のように書き換える。
入力に関わらず"Hello Serverless!!"と返すようになる。

```py
import json


def hello(event, context):
    body = {
        "message": "Hello Serverless!!"
    }

    response = {
        "statusCode": 200,
        "body": json.dumps(body)
    }

    return response
```

## API Gatewayを作成する

次に`serverless.yml`を下記のように編集する。

```yml
service: aws-python3

provider:
  name: aws
  runtime: python3.7

functions:
  hello:
    handler: handler.hello
    events:
      - http:
          path: hello
          method: get
```

`hello`エンドポイントに対するGetイベントが発生するとLambda関数を実行するようになる。

## デプロイ
デプロイは下記のコマンドでできる。

```sh
$ sls deploy -v
```

デプロイが完了すると下記のような出力がされる。

```sh
Service Information
service: aws-python3
stage: dev
region: <AWSのデフォルトのリージョン>
stack: aws-python3-dev
resources: 10
api keys:
  None
endpoints:
  GET - https://<エンドポイント>.execute-api.us-east-1.amazonaws.com/dev/hello
functions:
  hello: aws-python3-dev-hello
layers:
  None
```

`endpoints`の部分が今回作成したLambdaのAPIエンドポイント。
期待通りデプロイされているか試しに`curl`でgetリクエストを送ってみる。

```sh
$ curl -X GET https://vh3i1rl9nc.execute-api.us-east-1.amazonaws.com/dev/hello
{"message": "Hello Serverless!!"}
```

Serverless Frameworkを用いてHello worldを書くことができた。

## 削除
Hello worldを書きながらServerless Frameworkの基本的な挙動を確認することができた。
ただ、Hello worldといってもAWSのリソースを使っているため残しておくと課金が発生する。
なので今回作成したリソースはAWS上から削除しておく。

```sh
$ sls remove -v
```

## 参考にしたサイト
https://serverless.com/framework/docs/providers/aws/guide/credentials/
https://serverless.com/framework/docs/providers/aws/examples/hello-world/python/
https://dev.classmethod.jp/cloud/aws/serverless-first-serverlessframework/
