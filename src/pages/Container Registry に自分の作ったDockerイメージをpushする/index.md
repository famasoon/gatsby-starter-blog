---
title: Container Registry に自分の作ったDockerイメージをpushする
date: "2019-10-12"
---

https://cloud.google.com/container-registry/docs/pushing-and-pulling?hl=ja
プライベートなDockerコンテナレジストリが欲しかったので使ってみた。

1. `gcloud`コマンドのセットアップを終える
2. `gcloud auth configure-docker`でDocker Registryの認証をする
3. 下記コマンドでビルド済みのイメージ名にタグ付けをする

```bash
$ docker tag [任意のイメージ名] gcr.io/[プロジェクトID]/[イメージ名]:[バージョン]
```

4. 下記コマンドでContainer RegistryにDocker イメージを push

```bash
$ docker push gcr.io/[プロジェクト名]/[イメージ名]:[バージョン]
```

これで作ったDockerイメージのContainer Registryへpush完了