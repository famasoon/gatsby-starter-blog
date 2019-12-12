---
title: Crash JSON in golnag
date: "2019-12-12"
---

## 内容

下記のコードを見てほしい。

```go
package main

import (
	"encoding/json"
	"fmt"
)

func main() {
	var JSONDATA = []byte(`{\"\":'AAAA'}`)
    fmt.Printf("%v\n", JSONDATA)
    var raw map[string]interface{}
	err := json.Unmarshal(JSONDATA, &raw)
	if err != nil {
		panic(err)
	}

	fmt.Printf("%v\n", raw)
}

```

JSONをインターフェースにアンマーシャルしている。
これで構造体の中身が可変でもまぁ何とかUnmarshalできる。
では実行してみよう。

```sh
$ go run main.go
panic: invalid character '\\' looking for beginning of object key string

goroutine 1 [running]:
main.main()
        /Users/doejohn/work/projects/fuzz_go/fire/json/case2/main.go:13 +0x13c
exit status 2
```

うーむ、エラー内容をみるに本来`\"\"`として認識する所を`\\`として認識してエラーが発生しているよう...?

ちょっと手を加えてきちんと`"`とかを認識しているか確認。

```go
package main

import (
	"encoding/json"
	"fmt"
)

func main() {
	var JSONDATA = []byte(`{\"\":'AAAA'}`)
	fmt.Printf("%v\n", JSONDATA)
	var raw map[string]interface{}
	err := json.Unmarshal(JSONDATA, &raw)
	if err != nil {
		panic(err)
	}

	fmt.Printf("%v\n", raw)
}

```

しっかりと`JSONDATA`は[]byteとして作成されているようだ。
しかし結果は変わらない

```sh
[123 92 34 92 34 58 39 65 65 65 65 39 125]
panic: invalid character '\\' looking for beginning of object key string

goroutine 1 [running]:
main.main()
        /Users/doejohn/work/projects/fuzz_go/fire/json/case2/main.go:14 +0x1d6
exit status 2
```

って、よく見たら`AAAA`の部分を`\`でエスケープしていないじゃん。
ついでに`で囲っていた部分を"に変えた。
微妙にヒアドキュンとと普通の文字列扱いだと挙動が異なるような気がしたからだ(間違っていたらツッコンでください)
ということでエスケープしてみた。

```go
package main

import (
	"encoding/json"
	"fmt"
)

func main() {
	var JSONDATA = []byte("{\"\": \'AAAA\'}")
	fmt.Printf("%v\n", JSONDATA)
	var raw map[string]interface{}
	err := json.Unmarshal(JSONDATA, &raw)
	if err != nil {
		panic(err)
	}

	fmt.Printf("%v\n", raw)
}

```

実行してみた

```sh
$ go run main.go
[123 34 34 58 32 34 65 65 65 65 34 125]
map[:AAAA]
```

なんか問題なくUnmarshalできた。

## 結論
- エスケープはしっかりしよう

以上。
ファジんぐ全然捗らんな...