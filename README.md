# roblox-chcker

<p align="center">
  <img src="https://github.com/kcoderhtml/roblox-chcker/blob/master/.github/images/logo.png?raw=true" alt="square icon with funky orange and blue firey edges"/>
</p>

<p align="center">
    <i>Roblox tools :)</i>
</p>

## Usage

Install packages:

```bash
bun i
```

Run:

```bash
bun run index.ts
```

![demo gif](.github/images/out.gif)

### Advanced Usage

It is also possible to import a list of usernames to check from standard input.

Example that checks usernames from `usernames.txt` in the current directory:

```bash
cat usernames.txt | bun run index.ts
```

To use a web browser as the checking backend, add `--puppeteer` to the end of the command.

---

_© 2024 Kieran Klukas_  
_Licensed under [AGPL 3.0](LICENSE.md)_  