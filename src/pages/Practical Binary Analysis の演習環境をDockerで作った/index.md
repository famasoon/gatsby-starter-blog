---
title: Practical Binary Analysisの演習用環境をDockerで作った
date: "2019-10-12"
---


## 三行で
1. Practical Binary Analysis はリバースエンジニアリング入門にはうってつけの本
2. 基本的な演習環境はVMで配布されている
3. Dockerで環境を作るときはバージョンを指定しよう

## 概要
[Practical Binary Analysis](https://practicalbinaryanalysis.com/)はモダンなバイナリ解析について学ぶことができる本。
目次は下記の通り。

```
Chapter 1: Anatomy of a Binary
Chapter 2: The ELF Format
Chapter 3: The PE Format: A Brief Introduction
Chapter 4: Building a Binary Loader Using libbfd

Part II: Binary Analysis Fundamentals

Chapter 5: Basic Binary Analysis In Linux
Chapter 6: Disassembly and Binary Analysis Fundamentals
Chapter 7: Simple Code Injection Techniques for ELF

Part III: Advanced Binary Analysis

Chapter 8: Customizing Disassembly
Chapter 9: Binary Instrumentation
Chapter 10: Principles of Dynamic Taint Analysis
Chapter 11: Practical Dynamic Taint Analysis with libdft
Chapter 12: Principles of Symbolic Execution
Chapter 13: Practical Symbolic Execution with Triton

Part IV: Appendices

Appendix A: A Crash Course on x86 Assembly
Appendix B: Implementing PT_NOTE Overwriting Using libelf
Appendix C: List of Binary Analysis Tools
Appendix D: Further Reading
```

基礎的なディスアセンブラを実装したり、テイント解析やシンボリック実行をやったりと、今からリバースエンジニアリングをするなら抑えておきたい点を実装して手を動かしながら体系的に学ぶことができる。

## 実行環境について
そんなPractical Binary Analysisは演習用の実行環境としてVMを配布している。
別にVMでもいいのだが、単純にコードを参照したいくらいの時だと少し実行速度が遅い...
なので特段VMでないといけないような処理以外は`Docker`で実行しようと思い至った。
少しググった所、Practical Binary Analysisの演習用環境を`Docker`で作っている人がいたので、その環境を利用。

[https://github.com/wilvk/practical-binary](https://github.com/wilvk/practical-binary)

しかしこのコンテナ、`RUN apt-get -y install gcc-4.9 g++-4.9`を実行する際に下記エラーを出力しビルドが失敗してしまう。
```
Package g++-4.9 is not available, but is referred to by another package.
This may mean that the package is missing, has been obsoleted, or
is only available from another source
```

`RUN add-apt-repository -y ppa:ubuntu-toolchain-r/test`を実行しているのになぜ...?
ググるとこれはUbuntu 18.04に起因しているっぽい
[https://askubuntu.com/questions/1036108/install-gcc-4-9-at-ubuntu-18-04](https://askubuntu.com/questions/1036108/install-gcc-4-9-at-ubuntu-18-04)
`DockerFile`を改めて見ると最初の行でUbuntuのバージョンを指定していない。

```dockerfile
FROM ubuntu
RUN apt-get update
RUN apt-get -y install software-properties-common
RUN add-apt-repository -y ppa:ubuntu-toolchain-r/test
RUN apt-get update
RUN apt-get -y install gcc-4.9 g++-4.9
RUN update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-4.9 60 --slave /usr/bin/g++ g++ /usr/bin/g++-4.9
RUN apt-get -y install build-essential
RUN apt-get -y install libc6-dbg gdb valgrind
RUN apt-get -y install binutils-dev
RUN apt-get -y install strace
RUN apt-get -y install ltrace
RUN apt-get -y install vim-common
CMD ["/bin/bash"]
```

そのためUbuntu 18.04をダウンロードしてきてしまいビルドが失敗してしまう。
なのでUbuntuのバージョンを16.04に指定すると、失敗せずビルドすることができる。

```dockerfile
FROM ubuntu:16.04
RUN apt-get update
RUN apt-get -y install software-properties-common
RUN add-apt-repository -y ppa:ubuntu-toolchain-r/test
RUN apt-get update
RUN apt-get -y install gcc-4.9 g++-4.9
RUN update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-4.9 60 --slave /usr/bin/g++ g++ /usr/bin/g++-4.9
RUN apt-get -y install build-essential
RUN apt-get -y install libc6-dbg gdb valgrind
RUN apt-get -y install binutils-dev
RUN apt-get -y install strace
RUN apt-get -y install ltrace
RUN apt-get -y install vim-common
CMD ["/bin/bash"]
```

[https://github.com/famasoon/practical-binary/](https://github.com/famasoon/practical-binary) にコミットしておいた。
これで、とりあえずコードを見ながら軽く動作させる環境のできあがり。

## おわりに
[https://practicalbinaryanalysis.com/](https://practicalbinaryanalysis.com/) の`Running Code Samples on Windows and Other Platforms`の所でカーネル4.4以降だとうまく動作しないとか、そんな時のためのUbuntu 16.04 用カーネルダウングレードの仕方とかが載っているが、その時は適宜VMで演習をするなり環境を構築すればよいと思っているので問題なし。
という訳で環境を整えたのでリバースエンジニアリングをこれからやっていく(続く...?)