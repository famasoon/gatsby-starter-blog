---
title: Jupyter Notebook の導入
date: "2020-03-26"
---

# Jupyter Notebook の導入
## はじめに
Mac を買ったので新しく環境構築しました。
その際に行った作業のメモです。

## Jupyter Notebook とは
Python の対話的な実行環境のこと。
コードの共有や結果の可視化が楽にできます。
Markdownでメモを添えることもできます、便利ですね。
実はPython 以外も扱えます。
詳細は[公式](http://jupyter.org/)を見てください。

## インストール
### Jupyter Notebook
```shell
pip3 install jupyter
```

で簡単にインストールできます。

### Jupyter extension
これだけでも便利ですが、さらに便利にできる拡張機能群があるのでインストールします。
ソースコードは[ここ](https://github.com/ipython-contrib/jupyter_contrib_nbextensions)

```shell
pip3 install jupyter_contrib_nbextensions
jupyter contrib nbextension install --user
```

これで拡張機能が使えるようになりました。
http://localhost:8888/nbextensions で拡張機能を選択できるようになっています。
ちなみに自分はVimのキーバインドを使うために"Select CodeMirror Keymap"を、コードの展開とかを良い感じにやってくれる"Codefolding"と"Codefolding in Editor"を使っています。

### jupyter-themes
少し暗めの色が好きなのでテーマカラーを変更できる
[jupyter-themes](https://github.com/dunovank/jupyter-themes)
をインストールしてみます。

```shell
pip3 install jupyterthemes
jt -t oceans16 -T -N
```

これでテーマを変更することができました。
今回はoceans16を選択したが他にもテーマはあります。
下記コマンドで使用可能なテーマがリストとして出力されます。

```shell
jt -l
```

お好みのテーマを選んでみてください。

## おわりに
Jupyter Notebook の環境構築をやってみました。
本当に便利なので使う人増えて欲しいですね。
何か良い拡張機能を知っている方は良ければ教えてください。
