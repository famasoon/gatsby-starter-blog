---
title: LeetCode TwoSum をテストしながら解く
date: "2019-10-12"
---

[LeetCode](https://leetcode.com)という競技プログラミングサービスがある。
まだ始めたばかりなのだがとっつきやすい作りになっていて良い。
そんなLeetCodeの問題 **TwoSum** を解いてみた。
ただ解いてみたというのも面白くないので今回はテストコードも書きながら解答してみる。

## TwoSum
問題はへのリンク [https://leetcode.com/problems/two-sum/](https://leetcode.com/problems/two-sum/)。
問いは下記の通り。

> 数値の入った配列と整数値`target`が与えられるので、配列の中から足すと`target`になる値の組み合わせを見つけ、その要素がどこにあるかを答えよ。
> 必ず答えは存在するものとする。
> また別々の位置の値を必ず使用する事

以下に例を書く
> Given nums = [2, 7, 11, 15], target = 9,
> 
> Because nums[0] + nums[1] = 2 + 7 = 9,
> return [0, 1].

## テストコードを書く
コードを弄ってブラウザ上でテストしても問題はないが遅い。
なので今回は手元ですぐに動作するテストコードを書いた。

```go
package twosum

import (
	"reflect"
	"testing"
)

type testCase struct {
	array  []int
	target int
}

func TestTwoSum(t *testing.T) {
	tests := []struct {
		input  testCase
		output []int
	}{
        {testCase{[]int{2, 7, 11, 15}, 9}, []int{0, 1}},
        {testCase{[]int{2, 3, 4, 11, 15}, 6}, []int{0, 2}},
	}

	for i, tt := range tests {
		sum := twoSum(tt.input.array, tt.input.target)
		if !reflect.DeepEqual(sum, tt.output) {
			t.Errorf("tests[%d] failed - input: %+v - answer: %+v output: %d¥n", i, tt.input.array, tt.output, sum)
		}
	}
}
```

`$GOPATH/src/leetcode/twosum/`か何か適当なディレクトリでこれを書き`go test ./twosums/`と入力すればお手軽テスト環境の完成。

あとはこのテストを通るような解答を考える。

## 解答
いくつか解法がある。
2つループを書いて総当たりする方法なんかは簡単だが、渡されるスライスが大きくなればなるほど時間計算量が増える。
今回は一旦ハッシュテーブルを作成してその中から値の組み合わせを見つける解法で解いた。

```go
package twosum

func twoSum(nums []int, target int) []int {
	var res []int
	res = make([]int, 2)

	numMap := make(map[int]int)
	for i, num := range nums {
		numMap[num] = i
	}

	for j, firstNum := range nums {
		comp := target - firstNum
		value, ok := numMap[comp]
		if !ok {
			continue
		}
		if value == j {
			continue
		}

		res[0] = j
		res[1] = value

		return res
	}

	return res
}
```

1. 数値とその位置をハッシュテーブル化
2. `target`からスライスから取り出した数値を引き、足して`target`になる数値を取り出す
3. ハッシュテーブルを確認し、足して`target`になる値があればその位置を返す
4. 見つけるまで1-3を繰り返す

## 終わりに
Goのtest機能、楽に使えて良いですね。
まだLeetCode始めたばかりなのでもっと問題を解いていこうと思います。