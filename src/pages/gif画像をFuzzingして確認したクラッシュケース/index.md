---
title: gif画像をFuzzingして確認したクラッシュケース
date: "2019-12-08"
---

gif画像をFuzzingして確認したクラッシュケース
===

下記のコードを見てほしい。

```go
package main

import (
	"bytes"
	"fmt"
	"image/gif"
	"reflect"
)

func main() {
	img, err := gif.DecodeAll(bytes.NewReader([]byte("GIF89a0\x0000000!\xf9\x04\xf9000\x00,0\x000\x00\x00\x000\x00\x80000000\x02\x00;")))
	if err != nil {
		panic(err)
	}
	w := new(bytes.Buffer)
	err = gif.EncodeAll(w, img)
	if err != nil {
		panic(err)
	}
	img1, err := gif.DecodeAll(w)
	if err != nil {
		panic(err)
	}

	img1.Disposal = img.Disposal
	if !reflect.DeepEqual(img, img1) {
		fmt.Printf("gif0: %#v\n", img)
		fmt.Printf("gif1: %#v\n", img1)
		panic("gif changed")
	}
}
```

gif画像をEncodeしてDecodeして`reflect.DeepEqual`で内容が一致しているか確認しているコードだ。
一見すると内容は一致してそうだし、特にpanic等に入らずそのまま終了しそうなコードだ。
では結果を見てみよう。

```sh
$ go run main.go 
gif0: &gif.GIF{Image:[]*image.Paletted{(*image.Paletted)(0xc0000ac120)}, Delay:[]int{12336}, LoopCount:-1, Disposal:[]uint8{0x6}, Config:image.Config{ColorModel:color.Palette(nil), Width:48, Height:12336}, BackgroundIndex:0x0}
gif1: &gif.GIF{Image:[]*image.Paletted{(*image.Paletted)(0xc0000ac180)}, Delay:[]int{12336}, LoopCount:-1, Disposal:[]uint8{0x6}, Config:image.Config{ColorModel:color.Palette(nil), Width:48, Height:12336}, BackgroundIndex:0x0}
panic: gif changed

goroutine 1 [running]:
main.main()
        /home/ubuntu/workspace/fuzzing/docker-go-fuzz/fire/gif/main.go:29 +0x30a
exit status 2
```

`reflect.DeepEqual`で確認したところ内容の不一致が起きていることがわかる。
違う内容といえば`GIF`構造体の`Image []*image.Paletted`部分である。

内容が指している先のポインタが0x60バイト先となっている。
他の数値自体は特に変化は内容だ。

## image.Paletted
内容の不一致が起きている`image.Paletted`について見てみる。
ちなみに[Goのドキュメントはこちら](https://golang.org/pkg/image/#Paletted)

Paletted自体は下記の実装

```go
type Paletted struct {
	// Pix holds the image's pixels, as palette indices. The pixel at
	// (x, y) starts at Pix[(y-Rect.Min.Y)*Stride + (x-Rect.Min.X)*1].
	Pix []uint8
	// Stride is the Pix stride (in bytes) between vertically adjacent pixels.
	Stride int
	// Rect is the image's bounds.
	Rect Rectangle
	// Palette is the image's palette.
	Palette color.Palette
}
```

このPalettedは作成時に`NewPaletted`関数を使って作成するのがパット見、通例っぽい(間違えていたらツっ込んでください)
`NewPaletted`の実装は下記のとおりだ。

```go
// NewPaletted returns a new Paletted image with the given width, height and
// palette.
func NewPaletted(r Rectangle, p color.Palette) *Paletted {
	w, h := r.Dx(), r.Dy()
	pix := make([]uint8, 1*w*h)
	return &Paletted{pix, 1 * w, r, p}
}
```

こいつが新しくPalettedを作成しているからポインタがずれているのか？
とりあえずgifパッケージの方の実装も見てみる


## gif 実装

[https://golang.org/src/image/gif/reader.go](https://golang.org/src/image/gif/reader.go)
`NewPaletted`がどこで呼ばれているか確認。すると`newImageFromDescriptor()`で呼ばれている。

```go
func (d *decoder) newImageFromDescriptor() (*image.Paletted, error) {
	if err := readFull(d.r, d.tmp[:9]); err != nil {
		return nil, fmt.Errorf("gif: can't read image descriptor: %s", err)
	}
	left := int(d.tmp[0]) + int(d.tmp[1])<<8
	top := int(d.tmp[2]) + int(d.tmp[3])<<8
	width := int(d.tmp[4]) + int(d.tmp[5])<<8
	height := int(d.tmp[6]) + int(d.tmp[7])<<8
	d.imageFields = d.tmp[8]

	// The GIF89a spec, Section 20 (Image Descriptor) says: "Each image must
	// fit within the boundaries of the Logical Screen, as defined in the
	// Logical Screen Descriptor."
	//
	// This is conceptually similar to testing
	//	frameBounds := image.Rect(left, top, left+width, top+height)
	//	imageBounds := image.Rect(0, 0, d.width, d.height)
	//	if !frameBounds.In(imageBounds) { etc }
	// but the semantics of the Go image.Rectangle type is that r.In(s) is true
	// whenever r is an empty rectangle, even if r.Min.X > s.Max.X. Here, we
	// want something stricter.
	//
	// Note that, by construction, left >= 0 && top >= 0, so we only have to
	// explicitly compare frameBounds.Max (left+width, top+height) against
	// imageBounds.Max (d.width, d.height) and not frameBounds.Min (left, top)
	// against imageBounds.Min (0, 0).
	if left+width > d.width || top+height > d.height {
		return nil, errors.New("gif: frame bounds larger than image bounds")
	}
	return image.NewPaletted(image.Rectangle{
		Min: image.Point{left, top},
		Max: image.Point{left + width, top + height},
	}, nil), nil
}
```

この、`newImageFromDescriptor()`は`readImageDescriptor`関数で呼ばれている。

```go
func (d *decoder) readImageDescriptor(keepAllFrames bool) error {
	m, err := d.newImageFromDescriptor()
	if err != nil {
		return err
	}
	useLocalColorTable := d.imageFields&fColorTable != 0
	if useLocalColorTable {
		m.Palette, err = d.readColorTable(d.imageFields)
		if err != nil {
			return err
		}
	} else {
		if d.globalColorTable == nil {
			return errors.New("gif: no color table")
		}
		m.Palette = d.globalColorTable
	}
	if d.hasTransparentIndex {
		if !useLocalColorTable {
			// Clone the global color table.
			m.Palette = append(color.Palette(nil), d.globalColorTable...)
		}
		if ti := int(d.transparentIndex); ti < len(m.Palette) {
			m.Palette[ti] = color.RGBA{}
		} else {
			// The transparentIndex is out of range, which is an error
			// according to the spec, but Firefox and Google Chrome
			// seem OK with this, so we enlarge the palette with
			// transparent colors. See golang.org/issue/15059.
			p := make(color.Palette, ti+1)
			copy(p, m.Palette)
			for i := len(m.Palette); i < len(p); i++ {
				p[i] = color.RGBA{}
			}
			m.Palette = p
		}
	}
	litWidth, err := readByte(d.r)
	if err != nil {
		return fmt.Errorf("gif: reading image data: %v", err)
	}
	if litWidth < 2 || litWidth > 8 {
		return fmt.Errorf("gif: pixel size in decode out of range: %d", litWidth)
	}
	// A wonderfully Go-like piece of magic.
	br := &blockReader{d: d}
	lzwr := lzw.NewReader(br, lzw.LSB, int(litWidth))
	defer lzwr.Close()
	if err = readFull(lzwr, m.Pix); err != nil {
		if err != io.ErrUnexpectedEOF {
			return fmt.Errorf("gif: reading image data: %v", err)
		}
		return errNotEnough
	}
	// In theory, both lzwr and br should be exhausted. Reading from them
	// should yield (0, io.EOF).
	//
	// The spec (Appendix F - Compression), says that "An End of
	// Information code... must be the last code output by the encoder
	// for an image". In practice, though, giflib (a widely used C
	// library) does not enforce this, so we also accept lzwr returning
	// io.ErrUnexpectedEOF (meaning that the encoded stream hit io.EOF
	// before the LZW decoder saw an explicit end code), provided that
	// the io.ReadFull call above successfully read len(m.Pix) bytes.
	// See https://golang.org/issue/9856 for an example GIF.
	if n, err := lzwr.Read(d.tmp[256:257]); n != 0 || (err != io.EOF && err != io.ErrUnexpectedEOF) {
		if err != nil {
			return fmt.Errorf("gif: reading image data: %v", err)
		}
		return errTooMuch
	}

	// In practice, some GIFs have an extra byte in the data sub-block
	// stream, which we ignore. See https://golang.org/issue/16146.
	if err := br.close(); err == errTooMuch {
		return errTooMuch
	} else if err != nil {
		return fmt.Errorf("gif: reading image data: %v", err)
	}

	// Check that the color indexes are inside the palette.
	if len(m.Palette) < 256 {
		for _, pixel := range m.Pix {
			if int(pixel) >= len(m.Palette) {
				return errBadPixel
			}
		}
	}

	// Undo the interlacing if necessary.
	if d.imageFields&fInterlace != 0 {
		uninterlace(m)
	}

	if keepAllFrames || len(d.image) == 0 {
		d.image = append(d.image, m)
		d.delay = append(d.delay, d.delayTime)
		d.disposal = append(d.disposal, d.disposalMethod)
	}
	// The GIF89a spec, Section 23 (Graphic Control Extension) says:
	// "The scope of this extension is the first graphic rendering block
	// to follow." We therefore reset the GCE fields to zero.
	d.delayTime = 0
	d.hasTransparentIndex = false
	return nil
}
```

で、これは`decode()`で呼ばれている。

```go
func (d *decoder) decode(r io.Reader, configOnly, keepAllFrames bool) error {
	// Add buffering if r does not provide ReadByte.
	if rr, ok := r.(reader); ok {
		d.r = rr
	} else {
		d.r = bufio.NewReader(r)
	}

	d.loopCount = -1

	err := d.readHeaderAndScreenDescriptor()
	if err != nil {
		return err
	}
	if configOnly {
		return nil
	}

	for {
		c, err := readByte(d.r)
		if err != nil {
			return fmt.Errorf("gif: reading frames: %v", err)
		}
		switch c {
		case sExtension:
			if err = d.readExtension(); err != nil {
				return err
			}

		case sImageDescriptor:
			if err = d.readImageDescriptor(keepAllFrames); err != nil {
				return err
			}

		case sTrailer:
			if len(d.image) == 0 {
				return fmt.Errorf("gif: missing image data")
			}
			return nil

		default:
			return fmt.Errorf("gif: unknown block type: 0x%.2x", c)
		}
	}
}
```

この`decode`関数だが、名前から察することができると思うがポインタの不一致が起こった際に使われていた`DecodeAll`関数の中で呼ばれている。

```go
func DecodeAll(r io.Reader) (*GIF, error) {
	var d decoder
	if err := d.decode(r, false, true); err != nil {
		return nil, err
	}
	gif := &GIF{
		Image:     d.image,
		LoopCount: d.loopCount,
		Delay:     d.delay,
		Disposal:  d.disposal,
		Config: image.Config{
			ColorModel: d.globalColorTable,
			Width:      d.width,
			Height:     d.height,
		},
		BackgroundIndex: d.backgroundIndex,
	}
	return gif, nil
}
```

## タイムライン
時系列的にまとめるとこうなる

1. main関数が呼ばれる
2. gif.DecodeAll関数が呼ばれる
3. gif.decode関数が呼ばれる
4. gif.readImageDescriptor()関数が呼ばれる
5. gif.newImageFromDescriptor()関数が呼ばれる
6. `NewPaletted`ポインタが新しく確保される
7. `reflect.DeepEqual`で構造体の中を比較
8. 内部のポインタ値が異なるため`reflect.DeepEqual`は`False`を返す

となる

## 結論
gifファイルを`EncodeAll()`->`DecodeAll`すると`reflect.DeepEqual`で一致しない。

## 余談
ちなみに以下のようなコードにして動かすと`img.gif`と`img1.gif`というgif画像を吐き出す。
どちらも同じハッシュ値、ということで内部的にポインタがどうのこうのあっても吐き出されるファイルは同じだということは留意しておこう。

```go
package main

import (
	"bytes"
	"fmt"
	"image/gif"
	"os"
	"reflect"
)

func main() {
	img, err := gif.DecodeAll(bytes.NewReader([]byte("GIF89a0\x0000000!\xf9\x04\xf9000\x00,0\x000\x00\x00\x000\x00\x80000000\x02\x00;")))
	if err != nil {
		panic(err)
	}

	file, err := os.Create("img.gif")
	if err != nil {
		panic(err)
	}
	defer file.Close()

	err = gif.EncodeAll(file, img)
	if err != nil {
		panic(err)
	}

	w := new(bytes.Buffer)
	err = gif.EncodeAll(w, img)
	if err != nil {
		panic(err)
	}
	img1, err := gif.DecodeAll(w)
	if err != nil {
		panic(err)
	}

	file, err = os.Create("img1.gif")
	if err != nil {
		panic(err)
	}
	defer file.Close()

	err = gif.EncodeAll(file, img1)
	if err != nil {
		panic(err)
	}

	img1.Disposal = img.Disposal
	if !reflect.DeepEqual(img, img1) {
		fmt.Printf("gif0: %#v\n", img)
		fmt.Printf("gif1: %#v\n", img1)
		panic("gif changed")
	}
}

```

### Result

```sh
$ sha256sum *.gif
c798370b41e01236f2767cfd1d80968b0703c3e55408e641252e80ba6952a973  img.gif
c798370b41e01236f2767cfd1d80968b0703c3e55408e641252e80ba6952a973  img1.gif
```