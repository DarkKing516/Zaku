import CryptoJS from "crypto-js";

export class CryptoJs {
  private static SECRET_KEY = (() => {
    if (!process.env.NEXT_PUBLIC_KEY) throw new Error("KEY no definida en variables de entorno");
    return CryptoJS.enc.Utf8.parse(process.env.NEXT_PUBLIC_KEY);
  })();

  private static IV = (() => {
    if (!process.env.NEXT_PUBLIC_IV) throw new Error("IV no definido en variables de entorno");
    return CryptoJS.enc.Utf8.parse(process.env.NEXT_PUBLIC_IV);
  })();

  /** Encripta un texto plano con AES-CBC */
  static Encrypt(text: string): string {
    const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(text), CryptoJs.SECRET_KEY, {
      iv: CryptoJs.IV,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return encrypted.toString();
  }

  /** Desencripta un texto encriptado con AES-CBC */
  static Decrypt(encryptedText: string): string {
    const decrypted = CryptoJS.AES.decrypt(encryptedText, CryptoJs.SECRET_KEY, {
      iv: CryptoJs.IV,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return CryptoJS.enc.Utf8.stringify(decrypted);
  }
}
