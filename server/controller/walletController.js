import { ethers } from "ethers";
import * as bip39 from "bip39";
import * as ecc from "tiny-secp256k1";
import { BIP32Factory } from "bip32";
import * as bitcoin from "bitcoinjs-lib";

const bip32 = BIP32Factory(ecc);

//Generate the UNiversal Wallet Address fpr the User
export const generateUniversalWallet = async (req, res) => {
    try{
      const mnemonic = bip39.generateMnemonic();
      const seed = await bip39.mnemonicToSeed(mnemonic);

      // ETH Wallet (via ethers.js)
      const ethWallet = ethers.Wallet.fromPhrase(mnemonic);
      const ethAddress = ethWallet.address;
      const ethPrivateKey = ethWallet.privateKey;

      // BTC Wallet (via bitcoinjs-lib)
      const btcNetwork = bitcoin.networks.bitcoin;
      const root = bip32.fromSeed(seed, btcNetwork);
      const btcChild = root.derivePath(`m/84'/0'/0'/0/0`);
      const { address: btcAddress } = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(btcChild.publicKey),
        network: btcNetwork,
      });
      const btcPrivateKey = btcChild.toWIF();

      return res.status(200).json({
        mnemonic,
        ETH: {
          address: ethAddress,
          privateKey: ethPrivateKey,
        },
        BTC: {
          address: btcAddress,
          privateKey: btcPrivateKey,
        }
      });
    }catch(err){
      console.error("Wallet Generation Error:", err);
      return res.status(500).json({error:"Wallet generation failed"});
    }
  }
