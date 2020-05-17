---
title: twintについて使ってみる
date: "2020-05-17"
---

# Twint について使ってみる(初級編)

何をするにも現代人はすぐにTwintterに情報を投稿する。

それはそれで良いのだが、ごくまれにどのような情報を投稿しているか・フォロー/フォロワーは・たくさんRTしている人は誰かなんとなく調べたくなってしまう時がある。

Twitterに連絡してのAPI利用許可を貰えばいいだろうと思うが、昔と違い今はAPI申請も難しくなっている(ぶっちゃけ面倒)

そんなわけでどうにかしてAPIを使わずにTwitterの情報を集めるツールがないか探したところ[Twint](https://github.com/twintproject/twint)に出会った。

特定のユーザーからツイートを収集したり、特定のトピック、ハッシュタグやトレンドに関連するツイートを収集することができる(ツイート取得3,200件の壁はあるものの)
しかもプロキシ使い放題とは流石だ(未検証)

そんなわけで今回はTwintを利用するところまでを紹介する。

## インストール
[GitHub](https://github.com/twintproject/twint)に書かれている内容そのままで簡単にインストールできる。
1. `pip`でインストール

```pip3 install twint```

## 使ってみる
対象ユーザの最近のツイートとフォロワーをcsvファイルにしてみる。
今回は私のスクリーンネーム`FAMASoon`で検索してみる。

```python
import twint

def get_followers(username):
    c = twint.Config()
    c.Username = username
    c.Profile_full = True
    c.Store_csv = True
    c.Output = "recent_followers.csv"
    twint.run.Followers(c)

def get_recent_tweets(username):
    c = twint.Config()
    c.Username = username
    c.Store_csv = True
    c.Output = "recent_tweets.csv"
    twint.run.Search(c)

def main():
    # ここに任意のスクリーンネームを入力
    user_name = "FAMASoon"
    get_recent_tweets(user_name)
    get_followers(user_name)

if __name__ == "__main__":
    main()
```

`recent_followers.csv`や`recent_tweets.csv`という名前でフォロワーやツイートがリストアップされているだろう。

## 所感
結構簡単に使えた。
特定ユーザの動向をヲチするときとかに使えそう。