import { existsSync, readFileSync, writeFileSync } from "fs";

export default getSecrets();

function getSecrets(): {
    jwtSecretKey: string,
    cookiesSignature: string,
  } {
  const filename = '.secrets';

  if (existsSync(filename)) return JSON.parse(readFileSync(filename).toString());

  const secrets = {
    jwtSecretKey: generateRandomString(),
    cookiesSignature: generateRandomString(),
  };

  writeFileSync(filename, JSON.stringify(secrets));

  return secrets;
}

function generateRandomString() {
  const charCodes: number[] = [];
  const randomLength = 32 + ~~(Math.random() * 16 + 1);
  for (let i = 0; i < randomLength; i++) {
      let rand = Math.floor(Math.random() * 62);
      const charCode = rand += rand > 9 ? (rand < 36 ? 55 : 61) : 48;
      charCodes.push(charCode);
  }
  return String.fromCharCode(...charCodes);
}