import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { parseUnits } from 'ethers';

const lifiApiKey = process.env.LIFI_API_KEY;
const btcChainId = process.env.BTC_CHAINID;
const ethChainId = process.env.ETH_CHAINID;

const LIFI_BASE = process.env.LIFI_API_BASE;
const lifiIntegrator = process.env.LIFI_INTEGRATOR;
const lifiFee  = process.env.LIFI_FEE;
const lifiSlippage = process.env.LIFI_SLIPPAGE;
const infura_url = process.env.INFURA_RPC_URL;
 
// In-memory jobs for demo
const jobs = new Map();

const TOKEN_ADDRESSES = {
  BTC: process.env.BTC, // LiFi placeholder
  ETH: process.env.ETH,
  USDC: process.env.USDC,
  USDT: process.env.USDT,
};

const TOKEN_DECIMAL = {
  ETH: 18,
  USDC: 6,
  USDT: 6,
  BTC: 8,
};

const headers = {
  "Content-Type": "application/json",
  "x-lifi-api-key": lifiApiKey,
}

//Get LiFi Route for wrap/unwrap BTC<>EVM
export async function requestLiFiRoute({ privateKey, sellToken, buyToken, amount, takerAddress, receiverAddress }) {
  const routeRequest ={options:{}};
  if (sellToken === 'BTC' && buyToken !== 'BTC'){
    routeRequest.fromChainId = Number(btcChainId);      //Bitcoin ChainId
    routeRequest.toChainId = Number(ethChainId);        //Ethereum Mainnet ChainId 
  }else if (buyToken === 'BTC' && sellToken !== 'BTC'){
    routeRequest.fromChainId = Number(ethChainId);      //Ethereum Mainnet ChainId
    routeRequest.toChainId = Number(btcChainId);        //Bitcoin ChainId
  }else throw new Error('No wrap/unwrap needed for this pair');

  //Set required parameters: SellToken, BuyToken, Amount, TakerAddress, ReceiverAddress
  if (amount && takerAddress && receiverAddress ){
    const decimals = TOKEN_DECIMAL[sellToken];
    routeRequest.fromAmount = parseUnits(amount.toString(), decimals).toString();
    routeRequest.fromTokenAddress = TOKEN_ADDRESSES[sellToken] || sellToken;
    routeRequest.toTokenAddress = TOKEN_ADDRESSES[buyToken] || buyToken;
    routeRequest.fromAddress = takerAddress;
    routeRequest.toAddress = receiverAddress;
  }

  //Integrator parameters: Integrator, Fee, Slippage, AllowBridges
  if (lifiFee && lifiIntegrator && lifiSlippage){
    routeRequest.options.integrator = lifiIntegrator;
    //routeRequest.options.fee = Number(lifiFee);
    routeRequest.options.slippage = Number(lifiSlippage);
    routeRequest.options.allowBridges= ["symbiosis"];
  }

  // console.log("LiFi Route Request:", routeRequest);
  try{
    //Fetch LiFi routes(non-executable)
    const routes  = await axios.post(`${LIFI_BASE}/advanced/routes`, routeRequest, {headers});
    console.log("routes:",routes);
    if (!routes || routes.data.routes.length === 0){
      throw new Error('No available routes');
    } 

    const jobId = uuidv4();
    jobs.set(jobId, { jobId, status: 'PENDING', createdAt: Date.now() });
    const route = routes.data.routes[0].steps[0];

    //Fetch LiFi route execution details
    const execution = await axios.post(`${LIFI_BASE}/advanced/stepTransaction`,route, {headers});
    console.log("LiFi Execution:", execution);
    if (sellToken === "BTC"){

      const txData = execution.data;
      if (!txData || !txData.transactionRequest) throw new Error('No transaction data');

      return {
        type: 'BTC',
        psbtData: txData.transactionRequest?.data, // Hex PSBT data
        depositAddress: txData.transactionRequest?.to,
        amountToSend: txData.transactionRequest?.value, // base amount in satoshis(sats)
        feeCosts: txData.estimate?.feeCosts || [],
        gasCosts: txData.estimate?.gasCosts || [],
      };
    }else {

      const txData = execution.data;
      if (!txData || !txData.transactionRequest) throw new Error('No transaction data');

      return {
        type: 'EVM',
        transaction: txData.transactionRequest, // ready for ethers.js signer
        allowanceTarget: txData.estimate?.approvalAddress || null,
        sellToken: txData.action?.fromToken?.address,
        sellAmount: txData.action?.fromAmount,
        feeCosts: txData.estimate?.feeCosts || [],
        gasCosts: txData.estimate?.gasCosts || [],
      }
    }
  }catch(err){
    console.log("LiFi route error:", err);
    throw new Error(err);
  }
}

export async function checkLiFiStatus(jobId) {
  if (!jobs.has(jobId)) throw new Error('Job not found');

  const job = jobs.get(jobId);

  // Optionally call LiFi status endpoint if route has id
  const routeId = job.route?.id || null;
  if (routeId) {
    try {
      const resp = await axios.get(`${LIFI_BASE}/status/${routeId}`);
      const st = resp.data?.status || resp.data?.state;
      if (st && (st.toUpperCase() === 'DONE' || st.toUpperCase() === 'EXECUTED')) {
        job.status = 'DONE';
      } else if (st && st.toUpperCase() === 'FAILED') {
        job.status = 'FAILED';
      }
      jobs.set(jobId, job);
      return { jobId, status: job.status, raw: resp.data };
    } catch (e) {
      console.log(e);
      throw new Error(e);
    }
  }
}
