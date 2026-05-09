import * as KH from '/home/manuel/code/wesen/2026-05-09--automerge-discord/node_modules/@keyhive/keyhive/pkg-node/keyhive_wasm.js';
const kh=await KH.Keyhive.init(KH.Signer.generateMemory(), KH.CiphertextStore.newInMemory(),()=>{});
const cid=new KH.ChangeId(new Uint8Array([1,2,3]));
const doc=await kh.generateDocument([],cid,[]);
const enc=await kh.tryEncrypt(doc,new KH.ChangeId(new Uint8Array([4,5,6])), [cid], new TextEncoder().encode('hello'));
const encrypted=enc.encrypted_content();
console.log('encrypted bytes', encrypted.toBytes().length);
const plain=await kh.tryDecrypt(doc,encrypted);
console.log(new TextDecoder().decode(plain));
