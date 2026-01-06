import 'dotenv/config';
import axios from 'axios';
import { parseUnits } from 'ethers';
const ZEROX_BASE = process.env.ZEROX_BASE;
const PLATFORM_FEE_RECIPIENT = process.env.PLATFORM_FEE_RECIPIENT || null;
const feePercent = process.env.FEE_PERCENT;
const feeSide = process.env.FEE_SIDE;
const chain_id = process.env.CHAIN_ID;
const ZEEROX_API_KEY = process.env.ZEROX_API_KEY;
const ZEROX_VER = process.env.ZEROX_VERSION;

// services/zeroXService.js 
const TOKEN_ADDRESSES = {
  ETH: process.env.ETH,
  USDC: process.env.USDC,
  USDT: process.env.USDT,
};

const TOKEN_DECIMAL = {
  ETH: 18,
  USDC: 6,
  USDT: 6,
  WBTC: 8,
}

const headers = {
  '0x-api-key': ZEEROX_API_KEY,
  '0x-version': ZEROX_VER
}

export async function get0xQuote({ sellToken, buyToken, sellAmount, buyAmount, takerAddress }) {
  try {
    console.log(PLATFORM_FEE_RECIPIENT,feePercent,feeSide)
    console.log(sellToken, buyToken, sellAmount, buyAmount, takerAddress);
    if (!sellToken || !buyToken || (!sellAmount && !buyAmount) || !takerAddress)
      throw new Error('Missing required fields');

    const sellAddr = TOKEN_ADDRESSES[sellToken] || sellToken;
    const buyAddr = TOKEN_ADDRESSES[buyToken] || buyToken;

    const params = { sellToken: sellAddr, buyToken: buyAddr, taker: takerAddress };
    if (sellAmount){
      const decimals = TOKEN_DECIMAL[sellToken]; 
      params.sellAmount = parseUnits(sellAmount.toString(), decimals).toString();
    }
    if (buyAmount){ 
      const decimals = TOKEN_DECIMAL[buyToken];
      params.buyAmount = parseUnits(buyAmount.toString(), decimals).toString();
    }

    if (PLATFORM_FEE_RECIPIENT && feePercent && feeSide && chain_id) {
      params.swapFeeRecipient = PLATFORM_FEE_RECIPIENT;
      params.swapFeeBps = feePercent;
      params.chainId = chain_id;
      if (feeSide === 'buy') params.swapFeeToken = buyAddr;
      if (feeSide === 'sell') params.swapFeeToken = sellAddr;
    } 

    console.log("params:",params,"headers:",headers);


    const resp = await axios.get(`${ZEROX_BASE}/swap/allowance-holder/quote`, { params, headers });
    console.log("ressp:",resp);
    return resp.data;
  }catch(err){
    throw new Error(err.response?.data?.validationErrors || err.message);
  }
}
