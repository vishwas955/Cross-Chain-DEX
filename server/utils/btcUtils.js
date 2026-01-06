import axios from "axios";
import {getUserById} from "../models/demoDB.js";
import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from "bitcoinjs-lib";


bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc)

const blockStreamApi = process.env.BLOCKSTREAM_BASE_API;
console.log(blockStreamApi);
const network = bitcoin.networks.bitcoin;
export const buildSignBtcTx = async ({wif, psbtData}) => {

    try{
        const keyPair = ECPair.fromWIF(wif, network);
        const psbt = bitcoin.Psbt.fromHex(psbtData, {network});

        //Find Outputs that belongs to the sender for signing(memo)
        const opReturnOutput = psbt.txOutputs.find((output) => {
            if (output?.script) {
                const scriptHex = Array.from(output.script)
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('')
                
                console.log('Script hex:', scriptHex) // Add this line for debugging
                return scriptHex.startsWith('6a')
            }
            return false
        });

        const memo = opReturnOutput?.script ? (() => {
        const script = Array.from(opReturnOutput.script)
        
        // Skip OP_RETURN (0x6a) and get the push data length
        if (script.length > 2 && script[0] === 0x6a) {
            const dataLength = script[1] // Length of the data
            const memoBytes = script.slice(2, 2 + dataLength) // Extract memo bytes
            
            return new TextDecoder().decode(new Uint8Array(memoBytes))
        }
        return undefined
        })() : undefined
        console.log("Extracted memo:", memo || "none");

        psbt.signAllInputs(keyPair);
        psbt.validateSignaturesOfAllInputs((pubkey, msghash, signature) => {
            return ecc.verify(msghash, pubkey, signature);
        });
        psbt.finalizeAllInputs();
        
        const tx = psbt.extractTransaction();
        return {
            rawtxHex : tx.toHex(),
            txid: tx.getId(),
        };
    }catch(err){
        throw new Error(err);
    }
}

export const broadcastRawBtcTx = async (rawTxHex) => {
  try{
    const resp = await axios.post(`${blockStreamApi}/tx`, rawTxHex, { headers: { 'Content-Type': 'text/plain' } });

    const txid = resp.data;
    console.log("Broadcast successful, txid:", txid);
  }catch(err){
    if (err.response){
        throw new Error(`Broadcast Failed: ${err.response.status} ,${err.response.data}`);
    } else{
        throw new Error(`Broadcast Failed: ${err.message}`);
    }
  }
}

export const getBtcBalance = async (address) => {
    try {
        const {data: utxos} = await axios.get(`${blockStreamApi}/address/${address}/utxo`);
        const confirmed = utxos.filter(u => u.status?.confirmed);
        const sats = confirmed.reduce((sum, u) => sum + u.value, 0);
        return (sats / 1e8).toString();
    } catch (error) {
        console.error("Get BTC Balance Failed:", error);
        throw new Error(error);
    }
}