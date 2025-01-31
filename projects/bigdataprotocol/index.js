const sdk = require("@defillama/sdk");
const abi = require("./abi.json");
const { staking } = require("../helper/staking");
const { addFundsInMasterChef } = require("../helper/masterchef");
const { sumTokens2 } = require('../helper/unwrapLPs')
const { getLogs } = require('../helper/cache/getLogs')

const BDPMasterContract = "0x0De845955E2bF089012F682fE9bC81dD5f11B372";
const BDP = "0xf3dcbc6d72a4e1892f7917b7c43b74131df8480e";
const BFactory = '0xbe0083053744ecb871510c88dc0f6b77da162706'

const chain = 'ethereum'

const getCurrentTokensABI = {
  "constant": true,
  "inputs": [],
  "name": "getCurrentTokens",
  "outputs": [
    {
      "name": "tokens",
      "type": "address[]"
    }
  ],
  "payable": false,
  "stateMutability": "view",
  "type": "function"
}

const ethTvl = async (_, block, _1, { api }) => {
  const balances = {};
  /*** BDP Seed Pools (Data Vault seccion) TVL portion ***/
  await addFundsInMasterChef(
    balances,
    BDPMasterContract,
    block,
    chain,
    addr => addr,
    abi.poolInfo,
  );
  return balances
  const logs = await getLogs({
    api,
    target: BFactory,
    fromBlock: 11105585,
    topic: 'BPoolCreated(address,address)',
  })

  const pools = logs
    .map((log) => `0x${log.topics[1].substring(26)}`)

  const { output: tokens } = await sdk.api.abi.multiCall({
    abi: getCurrentTokensABI,
    calls: pools.map(i => ({ target: i })),
    chain, block,
  })

  const toa = []

  tokens.forEach(({ output, input: { target } }) => output.forEach(t => toa.push([t, target])))


  return sumTokens2({ balances, tokensAndOwners: toa, chain, block, });
};

module.exports = {
  ethereum: {
    staking: staking(BDPMasterContract, BDP),
    tvl: ethTvl,
  },
  methodology: `Counts liquidity in masterchef`
}