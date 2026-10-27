#!/usr/bin/env python3
"""ZT 密文字符串的独立解密（参考实现）。

只需要"密文字符串 + 密钥"：
    pip install cryptography
    python decrypt.py zt3.600000.<salt>.<iv>.<ct>            # 密钥会提示输入（不回显）
    python decrypt.py -                                        # 从标准输入逐行读取多个字符串

格式（详见 docs/format.md）：
    zt3.<iterations>.<salt>.<iv>.<ciphertext>      后三段为 base64url（无填充）
    key = PBKDF2-HMAC-SHA256(NFC(password).utf8, salt, iterations, 32 字节)
    明文 = AES-256-GCM 解密(key, iv, ciphertext||tag)，无 AAD，UTF-8
"""
import base64
import getpass
import hashlib
import re
import sys
import unicodedata

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

MIN_IT, MAX_IT = 1_000, 5_000_000


def b64url(s: str) -> bytes:
    if not re.fullmatch(r"[A-Za-z0-9_-]*", s) or len(s) % 4 == 1:
        raise ValueError("bad base64url")
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def decrypt_token(token: str, password: str) -> str:
    parts = token.strip().split(".")
    if len(parts) != 5 or parts[0] != "zt3" or not re.fullmatch(r"\d{1,9}", parts[1]):
        raise ValueError("not a valid zt3 token")
    iterations = int(parts[1])
    if not MIN_IT <= iterations <= MAX_IT:
        raise ValueError("iterations out of range")
    salt, iv, ct = b64url(parts[2]), b64url(parts[3]), b64url(parts[4])
    if len(salt) != 16 or len(iv) != 12 or len(ct) < 16:
        raise ValueError("bad token field length")
    key = hashlib.pbkdf2_hmac("sha256", unicodedata.normalize("NFC", password).encode("utf-8"), salt, iterations, 32)
    try:
        return AESGCM(key).decrypt(iv, ct, None).decode("utf-8")
    except InvalidTag:
        raise ValueError("decrypt failed: wrong key or corrupted token") from None


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__, file=sys.stderr)
        return 2
    tokens = [l for l in sys.stdin.read().splitlines() if l.strip()] if sys.argv[1] == "-" else [sys.argv[1]]
    password = getpass.getpass("Password: ")
    rc = 0
    for t in tokens:
        try:
            print(decrypt_token(t, password))
        except ValueError as e:
            print(f"error: {e}", file=sys.stderr)
            rc = 1
    return rc


if __name__ == "__main__":
    sys.exit(main())
