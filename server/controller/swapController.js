import { get0xQuote} from '../utils/zeroXServices.js';
import {ethers} from 'ethers';
import { buildSignBtcTx, broadcastRawBtcTx, getBtcBalance} from '../utils/btcUtils.js';
import {requestLiFiRoute} from '../utils/lifiServices.js';
import { getUserById } from '../models/demoDB.js';
import {send0xSwapTx, getERC20Balance, get0xSwapStatus} from '../utils/evmUtils.js';
import axios from 'axios';

export const executeSwap = async (req, res) => {
  try {
    const {userId, fromToken, toToken, amount} = req.body;
    const user = await getUserById(userId);

    if (fromToken === "BTC" || toToken === "BTC"){

      const fromAddress = fromToken === "BTC" ? user.btcWallet.address : user.evmWallet.address;
      const toAddress = toToken === "BTC" ? user.btcWallet.address : user.evmWallet.address;
      const wif = fromToken === "BTC" ? user.btcWallet.wif : null;
      const private_key = fromToken !== "BTC" ? user.evmWallet.privateKey : null;


      const routeRes = await requestLiFiRoute({privateKey: private_key, sellToken: fromToken, buyToken: toToken, amount, takerAddress: fromAddress, receiverAddress: toAddress});
      if (!routeRes) return res.status(500).json({error:"Li.Fi route not found."});
      console.log("Lifi response :",routeRes);

      if (fromToken === "BTC"){

        const depositAddress = routeRes.depositAddress;
        if (!depositAddress) return res.status(500).json({error:"Deposit Address not found through LI.FI"});

        const psbtData = routeRes.psbtData;
        if (!psbtData) return res.status(500).json({error:"PSBT data not found through LI.FI"});

        const signed = await buildSignBtcTx({wif, psbtData});
        const broadcast = await  broadcastRawBtcTx(signed.rawtxHex);

        return res.status(200).json({
          protocol:"LI.FI",
          txid: (await broadcast).txid || (await signed).txid,
          status:"completed",
          inputUsed: (await signed).inputCount,
          change: (await signed).change
        });
      }else{

        if (!routeRes.transaction) return res.status(500).json({error:"No Transaction data found through LI.FI"});
        
        const txHash = await send0xSwapTx({privateKey: private_key, quote:{
          transaction: routeRes.transaction,
          allowanceTarget: routeRes.allowanceTarget,
          sellToken: routeRes.sellToken,
          sellAmount: routeRes.sellAmount
        }});

        return res.status(200).json({
          protocol:"LI.FI", 
          status:"completed",
          txHash
        });
      }
    }else{
      console.log(user)
      const private_key = user.evmWallet.privateKey;
      const takerAddress = user.evmWallet.address;

      const routeRes = await get0xQuote({sellToken: fromToken, buyToken: toToken,sellAmount: amount, takerAddress});
      if (!routeRes.transaction || !routeRes.transaction.value || !routeRes.transaction.to || !routeRes.transaction.data) return res.status(500).json({error:"0x swap route not found."});
      const txHash = await send0xSwapTx({privateKey: private_key, quote: routeRes});
      return res.status(200).json({
          protocol:"0x Swap API",
          status:"completed",
          txHash
        }); 
    }
  } catch (error) {
    console.log("Swap Execution Failed:", error);
    res.status(500).json({ error: "Swap execution failed." });
  }
}
 
export const getEVMBal = async (req,res) => {
  const TOKEN_ADDRESS = {
    USDC: process.env.USDC,
    USDT: process.env.USDT,
  }

  const {userId} = req.query;
  const user = await getUserById(Number(userId));
  const address = user.evmWallet.address;
  const infura_rpc_url = process.env.INFURA_RPC_URL
  const provider = new ethers.JsonRpcProvider(infura_rpc_url);
  const wei = provider.getBalance(address);
  const eth = ethers.formatEther(await wei);
  const usdtBal = await getERC20Balance(TOKEN_ADDRESS["USDT"], address);
  const usdcBal = await getERC20Balance(TOKEN_ADDRESS["USDC"], address);
  return res.status(200).json({
    ETH: eth,
    USDT: usdtBal,
    USDC: usdcBal,
  });

}

export const checkSwapStatus = async (req,res) => {
  const {txHash, protocol} = req.query;
  if (!txHash || !protocol) return res.status(400).json({error:"txHash and protocol are required"});
  
  try {
    if(protocol === "LI.FI"){
      const resp = await axios.get(`https://li.quest/v1/status?txHash=${txHash}`);
      const status = resp.data?.status || resp.data?.state || "UNKNOWN";
      const subStatus = resp.data?.subStatus === "REFUNDED" ? resp.data.subStatus : null ;
      return res.status(200).json({status, subStatus});
    }else{
      const Zer0xResp = await get0xSwapStatus({txHash});
      if(!Zer0xResp) return res.status(500).json({error:"0x status fetch error"});
    }
  } catch (error) {
    console.log("Check Status Failed:", error);
    res.status(500).json({ error: "Check status failed." });
  }
}

export const getBTCBal = async (req,res) => {
  const {userId} = req.query;
  const user = await getUserById(Number(userId));
  const address = user.btcWallet.address;
  const balance = await getBtcBalance(address);
  return res.status(200).json({
    BTC: balance
  });
}

