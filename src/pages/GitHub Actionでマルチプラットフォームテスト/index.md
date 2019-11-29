---
title: GitHub Actionでマルチプラットフォームなテストをした
date: "2019-11-30"
---

## 概要
[【GitHub Actions】Go言語の自動テストからリリースまでを作ってみた](https://qiita.com/x-color/items/f60025c20a547a7355b5) と [GitHub Actions for Go](https://github.com/mvdan/github-actions-golang) を参考にLinux, Mac, WindowsでGo言語製ツールをテストした。
あと[GitHub Actionsのワークフロー構文](https://help.github.com/ja/actions/automating-your-workflow-with-github-actions/workflow-syntax-for-github-actions)も参考にした。

成果物は下記リンクを参照。

[https://github.com/famasoon/crtsh/blob/master/.github/workflows/go_test.yml](https://github.com/famasoon/crtsh/blob/master/.github/workflows/go_test.yml)

内容は`.github/workflows/go_test.yml`の中。

```yml
name: Run tests on multi environment
on: [push, pull_request]
jobs:
  test:
    strategy:
      matrix:
        go-version: [1.12.x, 1.13.x]
        platform: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.platform }}
    steps:
    - name: Install Go
      uses: actions/setup-go@v1
      with:
        go-version: ${{ matrix.go-version }}
    - name: Checkout code
      uses: actions/checkout@v1
    - name: Get dependcies
      run: go get -v -t -d ./...
    - name: Test
      run: go test ./...
```

## 解説
- `name`: ワークフローの名前
- `on`: イベントの種類。今回は`push`もしくは`pull request`を検知しワークフローを開始する
- `jobs`: イベントを検知した時の一連のタスク
- `strategy`: 各ジョブごとに設定できる環境設定
- `matrix`: 　Go言語の複数バージョンと複数プラットフォームを設定した。ワークフロー構文に詳細が書いてあるので要参照 
- `runs-on`: 実行するプラットフォームを書く。今回は`matrix`に記入したプラットフォームを参照させた

あとは各ステップの要点を書く

- `uses: actions/setup-go@v1`: Go言語の環境をワークフローを実行しているコンテナに作成。`go-version: ${{ matrix.go-version }}`で複数バージョンを試すようにしている
- `uses: actions/checkout@v1`: ワークフローの実行環境にコードをチェックアウトしてくれる。これで`push`なり`pull request`をしたコードをワークフロー環境に移す
- `run: go get -v -t -d ./...`: 依存関係にあるコードを落としてきたりユニットテストを実行する
- `run: go test ./...`: 当該リポジトリの内のパッケージのテストを実施する

当たり前だが各パッケージのテストをいい加減に書いていると無条件で通ってしまうので気をつけるように。
以上。