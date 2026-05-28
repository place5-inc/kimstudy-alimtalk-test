#!/usr/bin/env node
import bcrypt from 'bcryptjs';

const arg = process.argv[2];
if (!arg) {
  console.error("사용법: node scripts/hash-password.mjs '새비밀번호'");
  process.exit(1);
}
if (arg.length < 8) {
  console.error('비밀번호는 8자 이상이어야 합니다.');
  process.exit(1);
}

const hash = await bcrypt.hash(arg, 12);
console.log(hash);
