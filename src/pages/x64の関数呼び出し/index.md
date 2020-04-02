---
title: x64の関数呼び出し
date: "2020-03-26"
---

## 概要
関数呼び出しの解説でよくあるx86プログラムみたいな動きをx64でやってみる

## 環境

```bash
$ uname -a
Linux ubuntu-xenial 4.4.0-97-generic #120-Ubuntu SMP Tue Sep 19 17:28:18 UTC 2017 x86_64 x86_64 x86_64 GNU/Linux

$ lsb_release -a
No LSB modules are available.
Distributor ID: Ubuntu
Description:    Ubuntu 16.04.3 LTS
Release:        16.04
Codename:       xenial

$ gcc --version
gcc (Ubuntu 5.4.0-6ubuntu1~16.04.5) 5.4.0 20160609
```

## x86でコンパイル
まずはx86でのスタックの動きを書く。
まずは下のコードを"stack_test.c"として保存する。

```c
void test_func(int a, int b, int c, int d){
    int x, y, z;
    x = a + b;
    y = c + d;
    z = x + y;
}

int main(void){
    test_func(1, 2, 3, 4);
    return 0;
}
```

これをコンパイルして"x86"というファイルで保存し、ディスアセンブルする。

```bash
$ gcc -O0 -m32 stack_test.c -o x86
$ objdump -d -M intel x86  | grep -A11 "main>:"
080483f9 <main>:
 80483f9:       55                      push   ebp
 80483fa:       89 e5                   mov    ebp,esp
 80483fc:       6a 04                   push   0x4
 80483fe:       6a 03                   push   0x3
 8048400:       6a 02                   push   0x2
 8048402:       6a 01                   push   0x1
 8048404:       e8 d2 ff ff ff          call   80483db <test_func>
 8048409:       83 c4 10                add    esp,0x10
 804840c:       b8 00 00 00 00          mov    eax,0x0
 8048411:       c9                      leave
 8048412:       c3                      ret
 $ objdump -d -M intel x86  | grep -A14 "test_func>:"
080483db <test_func>:
 80483db:       55                      push   ebp
 80483dc:       89 e5                   mov    ebp,esp
 80483de:       83 ec 10                sub    esp,0x10
 80483e1:       8b 55 08                mov    edx,DWORD PTR [ebp+0x8]
 80483e4:       8b 45 0c                mov    eax,DWORD PTR [ebp+0xc]
 80483e7:       01 c2                   add    edx,eax
 80483e9:       8b 45 10                mov    eax,DWORD PTR [ebp+0x10]
 80483ec:       01 c2                   add    edx,eax
 80483ee:       8b 45 14                mov    eax,DWORD PTR [ebp+0x14]
 80483f1:       01 d0                   add    eax,edx
 80483f3:       89 45 fc                mov    DWORD PTR [ebp-0x4],eax
 80483f6:       90                      nop
 80483f7:       c9                      leave
 80483f8:       c3                      ret
 ```

main関数で引数をプッシュし"test_func"で使用している。
また、ローカル変数を確保するためにespを減算している。

## x64でコンパイル
今度はx64でコンパイルし、ディスアセンブルしてみる。

```bash
$ gcc -O0 stack_test.c -o x64
$ objdump -d -M intel x64 | grep -A10 "main>:"
00000000004004fe <main>:
  4004fe:       55                      push   rbp
  4004ff:       48 89 e5                mov    rbp,rsp
  400502:       b9 04 00 00 00          mov    ecx,0x4
  400507:       ba 03 00 00 00          mov    edx,0x3
  40050c:       be 02 00 00 00          mov    esi,0x2
  400511:       bf 01 00 00 00          mov    edi,0x1
  400516:       e8 bb ff ff ff          call   4004d6 <test_func>
  40051b:       b8 00 00 00 00          mov    eax,0x0
  400520:       5d                      pop    rbp
  400521:       c3                      ret
$ objdump -d -M intel x64 | grep -A17 "test_func>:"
00000000004004d6 <test_func>:
  4004d6:       55                      push   rbp
  4004d7:       48 89 e5                mov    rbp,rsp
  4004da:       89 7d ec                mov    DWORD PTR [rbp-0x14],edi
  4004dd:       89 75 e8                mov    DWORD PTR [rbp-0x18],esi
  4004e0:       89 55 e4                mov    DWORD PTR [rbp-0x1c],edx
  4004e3:       89 4d e0                mov    DWORD PTR [rbp-0x20],ecx
  4004e6:       8b 55 ec                mov    edx,DWORD PTR [rbp-0x14]
  4004e9:       8b 45 e8                mov    eax,DWORD PTR [rbp-0x18]
  4004ec:       01 c2                   add    edx,eax
  4004ee:       8b 45 e4                mov    eax,DWORD PTR [rbp-0x1c]
  4004f1:       01 c2                   add    edx,eax
  4004f3:       8b 45 e0                mov    eax,DWORD PTR [rbp-0x20]
  4004f6:       01 d0                   add    eax,edx
  4004f8:       89 45 fc                mov    DWORD PTR [rbp-0x4],eax
  4004fb:       90                      nop
  4004fc:       5d                      pop    rbp
  4004fd:       c3                      ret
```

main関数から"test_func"を呼ぶ時に引数をプッシュせずレジスタに入れるようになった。
また、"test_func"内ではスタックポインタを減算せずにローカル変数を使用するようになった。
これらの違いは何なのだろうか。

## x64における関数呼出し時の引数
x64のSystem V ABI(Unix系OSの関数呼び出し規約)では第1~6引数まではレジスタを使用し、第7引数以降はスタックを使うようにするようだ。
具体的に以下の順番で引数をレジスタに入れる。

|引数|レジスタ|
|:--:|:--:|
|第1引数|RDI|
|第2引数|RSI|
|第3引数|RDX|
|第4引数|RCX|
|第5引数|R8|
|第6引数|R9|

なのでスタックにプッシュする様子を見たい時は7個以上の引数を使えば良い。

```c
void test_func(int a, int b, int c, int d,
               int e, int f, int g, int h){
    int x;
    x = a + b + c + d;
}

int main(void){
    test_func(1, 2, 3, 4, 5, 6, 7, 8);
    return 0;
}
```

これをコンパイルしてディスアセンブルすると引数をプッシュするようになる。

```bash
$ gcc -O0 stack_test2.c -o x64_2
$ objdump -d -M intel x64_2 | grep -A15 "main>:"
0000000000400506 <main>:
  400506:       55                      push   rbp
  400507:       48 89 e5                mov    rbp,rsp
  40050a:       6a 08                   push   0x8
  40050c:       6a 07                   push   0x7
  40050e:       41 b9 06 00 00 00       mov    r9d,0x6
  400514:       41 b8 05 00 00 00       mov    r8d,0x5
  40051a:       b9 04 00 00 00          mov    ecx,0x4
  40051f:       ba 03 00 00 00          mov    edx,0x3
  400524:       be 02 00 00 00          mov    esi,0x2
  400529:       bf 01 00 00 00          mov    edi,0x1
  40052e:       e8 a3 ff ff ff          call   4004d6 <test_func>
  400533:       48 83 c4 10             add    rsp,0x10
  400537:       b8 00 00 00 00          mov    eax,0x0
  40053c:       c9                      leave
  40053d:       c3                      ret
$ objdump -d -M intel x64_2 | grep -A19 "test_func>:"
00000000004004d6 <test_func>:
  4004d6:       55                      push   rbp
  4004d7:       48 89 e5                mov    rbp,rsp
  4004da:       89 7d ec                mov    DWORD PTR [rbp-0x14],edi
  4004dd:       89 75 e8                mov    DWORD PTR [rbp-0x18],esi
  4004e0:       89 55 e4                mov    DWORD PTR [rbp-0x1c],edx
  4004e3:       89 4d e0                mov    DWORD PTR [rbp-0x20],ecx
  4004e6:       44 89 45 dc             mov    DWORD PTR [rbp-0x24],r8d
  4004ea:       44 89 4d d8             mov    DWORD PTR [rbp-0x28],r9d
  4004ee:       8b 55 ec                mov    edx,DWORD PTR [rbp-0x14]
  4004f1:       8b 45 e8                mov    eax,DWORD PTR [rbp-0x18]
  4004f4:       01 c2                   add    edx,eax
  4004f6:       8b 45 e4                mov    eax,DWORD PTR [rbp-0x1c]
  4004f9:       01 c2                   add    edx,eax
  4004fb:       8b 45 e0                mov    eax,DWORD PTR [rbp-0x20]
  4004fe:       01 d0                   add    eax,edx
  400500:       89 45 fc                mov    DWORD PTR [rbp-0x4],eax
  400503:       90                      nop
  400504:       5d                      pop    rbp
  400505:       c3                      ret
```

main関数で7,8番目の引数をスタックにプッシュされるようになった。

## Red Zone
x64ではRSPから128バイト引いたところまでを"Red Zone"としている。
"Red Zone"の範囲内に収まるのならスタックポインタを減算せずに使用できるようだ。
"Red Zone"を使わないようにするにはgccでコンパイルする際に"-fno-red-zone"オプションを付ける。
オプションを付けてコンパイルしてみる。

```bash
$ gcc -O0 -mno-red-zone stack_test2.c -o x64_3
$ objdump -d -M intel x64_3 | grep -A15 "main>:"
000000000040050a <main>:
  40050a:       55                      push   rbp
  40050b:       48 89 e5                mov    rbp,rsp
  40050e:       6a 08                   push   0x8
  400510:       6a 07                   push   0x7
  400512:       41 b9 06 00 00 00       mov    r9d,0x6
  400518:       41 b8 05 00 00 00       mov    r8d,0x5
  40051e:       b9 04 00 00 00          mov    ecx,0x4
  400523:       ba 03 00 00 00          mov    edx,0x3
  400528:       be 02 00 00 00          mov    esi,0x2
  40052d:       bf 01 00 00 00          mov    edi,0x1
  400532:       e8 9f ff ff ff          call   4004d6 <test_func>
  400537:       48 83 c4 10             add    rsp,0x10
  40053b:       b8 00 00 00 00          mov    eax,0x0
  400540:       c9                      leave
  400541:       c3                      ret
$ objdump -d -M intel x64_3 | grep -A20 "test_func>:"
00000000004004d6 <test_func>:
  4004d6:       55                      push   rbp
  4004d7:       48 89 e5                mov    rbp,rsp
  4004da:       48 83 ec 28             sub    rsp,0x28
  4004de:       89 7d ec                mov    DWORD PTR [rbp-0x14],edi
  4004e1:       89 75 e8                mov    DWORD PTR [rbp-0x18],esi
  4004e4:       89 55 e4                mov    DWORD PTR [rbp-0x1c],edx
  4004e7:       89 4d e0                mov    DWORD PTR [rbp-0x20],ecx
  4004ea:       44 89 45 dc             mov    DWORD PTR [rbp-0x24],r8d
  4004ee:       44 89 4d d8             mov    DWORD PTR [rbp-0x28],r9d
  4004f2:       8b 55 ec                mov    edx,DWORD PTR [rbp-0x14]
  4004f5:       8b 45 e8                mov    eax,DWORD PTR [rbp-0x18]
  4004f8:       01 c2                   add    edx,eax
  4004fa:       8b 45 e4                mov    eax,DWORD PTR [rbp-0x1c]
  4004fd:       01 c2                   add    edx,eax
  4004ff:       8b 45 e0                mov    eax,DWORD PTR [rbp-0x20]
  400502:       01 d0                   add    eax,edx
  400504:       89 45 fc                mov    DWORD PTR [rbp-0x4],eax
  400507:       90                      nop
  400508:       c9                      leave
  400509:       c3                      ret
```

RSPを減算しスタックフレームを残すようになった。

## まとめ
* x64では引数が6個以下だとスタックにプッシュされない
* x64ではRSPから128バイト引いたところまでは"Red Zone"としておりRSPを減算しないで使える

## 参考資料
* [Stack frame layout on x86-64](https://eli.thegreenplace.net/2011/09/06/stack-frame-layout-on-x86-64)
* [AMD64 ABI の特徴](https://docs.oracle.com/cd/E19253-01/819-0389/fcowb/index.html)