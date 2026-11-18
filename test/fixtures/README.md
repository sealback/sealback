# Interoperability fixtures

Created with the `age` CLI, version 1.3.2, to check that Sealback decrypts
what `age` produces (`test/interop.test.js`). These are test keys only; never
use them for real secrets.

| File | Content |
|---|---|
| `plaintext.txt` | The message (non-ASCII on purpose) |
| `x25519-key.txt` | X25519 identity from `age-keygen` |
| `mlkem768x25519-key.txt` | ML-KEM-768 + X25519 identity from `age-keygen -pq` |
| `*-key.protected.age` | The key file above encrypted with `age -p`, passphrase `correct horse battery staple` |
| `*-message.age` | `plaintext.txt` encrypted to the key, binary |
| `*-message.armored.age` | `plaintext.txt` encrypted to the key, ASCII armor |

Commands:

```sh
age-keygen -o x25519-key.txt
age-keygen -pq -o mlkem768x25519-key.txt
printf 'Grüße aus Hamburg! 🦭 p@ss\nw0rd\n' > plaintext.txt
for t in x25519 mlkem768x25519; do
  r=$(age-keygen -y $t-key.txt)
  age -r "$r" -a -o $t-message.armored.age plaintext.txt
  age -r "$r" -o $t-message.age plaintext.txt
  age -p -o $t-key.protected.age $t-key.txt   # enter the passphrase twice
done
```
