import "@nomiclabs/hardhat-waffle";

import "@nomicfoundation/hardhat-toolbox-viem";
import "@openzeppelin/hardhat-upgrades";
// import "@nomicfoundation/hardhat-chai-matchers";

import "@nomiclabs/hardhat-ethers";
require("dotenv").config();

/// ENVVAR
// - CI:                output gas report to file instead of stdout
// - COVERAGE:          enable coverage report
// - ENABLE_GAS_REPORT: enable gas report
// - COMPILE_MODE:      production modes enables optimizations (default: development)
// - COMPILE_VERSION:   compiler version (default: 0.8.9)
// - COINMARKETCAP:     coinmarketcap api key for USD value in gas report

const argv = require("yargs/yargs")()
  .env("")
  .options({
    coverage: { type: "boolean", default: false },
    gas: { alias: "enableGasReport", type: "boolean", default: false },
    gasReport: {
      alias: "enableGasReportPath",
      type: "string",
      implies: "gas",
      default: undefined,
    },
    mode: {
      alias: "compileMode",
      type: "string",
      choices: ["production", "development"],
      default: "development",
    },
    ir: { alias: "enableIR", type: "boolean", default: false },
    compiler: { alias: "compileVersion", type: "string", default: "0.8.13" },
    coinmarketcap: { alias: "coinmarketcapApiKey", type: "string" },
  }).argv;

const withOptimizations = argv.gas || argv.compileMode === "production";

const {
  PRIVATE_KEY,
  ALCHEMY_API_KEY = "",
  ALCHEMY_RINKEBY_API_KEY = "",
  ALCHEMY_ROPSTEN_API_KEY = "",
  ETHERSCAN_API_KEY = "",
  INFURA_API_KEY = "",
  ARBISCAN_API_KEY = "",
  POLYGONSCAN_API_KEY = "",
  OPTIMISM_API_KEY = "",
  ALCHEMY_ARBITRUM_API_KEY = "",
} = process.env;

// Never use a fallback private key. Networks without an explicitly configured
// key receive no signing accounts and cannot submit transactions accidentally.
const accounts = PRIVATE_KEY
  ? [PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`]
  : [];

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
let config = {
  solidity: {
    compilers: [{
      version: "0.8.26",
      settings: {
        optimizer: { enabled: true, runs: 200 },
        evmVersion: "cancun",
      },
    }],
  },
  networks: {
    hardhat: { blockGasLimit: 10000000, initialBaseFeePerGas: 0 },
    goerli: { url: "https://eth-goerli.public.blastapi.io", accounts },
    sepolia: { url: "https://rpc.sepolia.org", accounts },
    rinkeby: { url: `https://rinkeby.infura.io/v3/${INFURA_API_KEY}`, accounts },
    polygonMumbai: { url: "https://rpc-mumbai.maticvigil.com", accounts },
    mainnet: { url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`, accounts },
    bsc: { url: "https://bsc-dataseed1.binance.org:443", accounts },
    xdai: { url: "https://rpc.xdaichain.com/", accounts },
    polygon: { url: `https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`, accounts },
    arbitrumOne: { url: "https://arb1.arbitrum.io/rpc", accounts },
    arbitrumTestnet: { url: "https://rinkeby.arbitrum.io/rpc", accounts },
    optimisticEthereum: { url: "https://mainnet.optimism.io", accounts },
  },
  etherscan: {
    enabled: true,
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      goerli: ETHERSCAN_API_KEY,
      arbitrumTestnet: ARBISCAN_API_KEY,
      arbitrumOne: ARBISCAN_API_KEY,
      polygonMumbai: POLYGONSCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
      optimisticEthereum: OPTIMISM_API_KEY,
    },
  },
};

if (argv.gas) {
  require("hardhat-gas-reporter");
  module.exports.gasReporter = {
    showMethodSig: true,
    currency: "USD",
    outputFile: argv.gasReport,
    coinmarketcap: argv.coinmarketcap,
  };
}

if (argv.coverage) {
  require("solidity-coverage");
}

export default config;
