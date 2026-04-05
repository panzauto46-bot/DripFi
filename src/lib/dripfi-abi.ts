import { parseAbi } from "viem";

export const dcaVaultAbi = parseAbi([
  "function createStrategy(address tokenIn, address tokenOut, uint256 amountPerOrder, uint64 interval) returns (uint256 strategyId)",
  "function createStrategyWithRecipient(address tokenIn, address tokenOut, address recipient, uint256 amountPerOrder, uint64 interval) returns (uint256 strategyId)",
  "function createStrategyAndFund(address tokenIn, address tokenOut, uint256 amountPerOrder, uint64 interval, uint256 initialAmount) returns (uint256 strategyId)",
  "function fundStrategy(uint256 strategyId, uint256 amount)",
  "function pauseStrategy(uint256 strategyId)",
  "function resumeStrategy(uint256 strategyId)",
  "function cancelStrategy(uint256 strategyId)",
  "function withdrawFunds(uint256 strategyId) returns (uint256 amount)",
  "function executeOrder(uint256 strategyId) returns (uint256 amountOut)",
  "function executeOrderWithMinOut(uint256 strategyId, uint256 minAmountOut) returns (uint256 amountOut)",
  "function setSessionKey(address sessionKey, bool approved)",
  "function setStrategyRecipient(uint256 strategyId, address recipient)",
  "function strategies(uint256 strategyId) view returns (address owner, address tokenIn, address tokenOut, address recipient, uint256 amountPerOrder, uint64 interval, uint64 lastExecutedAt, uint256 availableBalance, uint8 status)",
  "function strategyCount() view returns (uint256)",
  "function getStrategyIdsByOwner(address owner) view returns (uint256[] memory)",
  "function nextExecutionAt(uint256 strategyId) view returns (uint256)",
  "function canExecuteStrategy(uint256 strategyId) view returns (bool)",
  "function isExecutionAuthorized(uint256 strategyId, address executor) view returns (bool)",
  "function previewExecution(uint256 strategyId) view returns (uint256 amountToSwap, uint256 feePaid, uint256 expectedAmountOut)",
  "function getExecutionHistory(uint256 strategyId) view returns ((uint64 executedAt, uint256 amountIn, uint256 feePaid, uint256 amountOut)[] memory)",
  "function approvedSessionKeys(address user, address sessionKey) view returns (bool)",
  "function executionFeeBps() view returns (uint16)",
]);

export const erc20Abi = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
]);
