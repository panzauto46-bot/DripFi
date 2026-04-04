// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ISwapRouter} from "./interfaces/ISwapRouter.sol";
import {SafeTransferLib} from "./libraries/SafeTransferLib.sol";
import {Owned} from "./libraries/Owned.sol";

contract SwapRouter is ISwapRouter, Owned {
    using SafeTransferLib for address;

    error PairNotConfigured();
    error SlippageExceeded();

    mapping(address tokenIn => mapping(address tokenOut => uint256 quotePerTokenInE18)) public quotes;

    event PairQuoteUpdated(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 quotePerTokenInE18
    );
    event SwapExecuted(
        address indexed caller,
        address indexed recipient,
        address indexed tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    event LiquidityDeposited(address indexed token, uint256 amount);

    constructor(address initialOwner) Owned(initialOwner) {}

    function setPairQuote(
        address tokenIn,
        address tokenOut,
        uint256 quotePerTokenInE18
    ) external onlyOwner {
        quotes[tokenIn][tokenOut] = quotePerTokenInE18;
        emit PairQuoteUpdated(tokenIn, tokenOut, quotePerTokenInE18);
    }

    function getAmountOut(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) public view override returns (uint256 amountOut) {
        uint256 quote = quotes[tokenIn][tokenOut];
        if (quote == 0) revert PairNotConfigured();
        amountOut = amountIn * quote / 1e18;
    }

    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        address recipient,
        uint256 minAmountOut
    ) external override returns (uint256 amountOut) {
        amountOut = getAmountOut(tokenIn, tokenOut, amountIn);
        if (amountOut < minAmountOut) revert SlippageExceeded();

        tokenIn.safeTransferFrom(msg.sender, address(this), amountIn);
        tokenOut.safeTransfer(recipient, amountOut);

        emit SwapExecuted(msg.sender, recipient, tokenIn, tokenOut, amountIn, amountOut);
    }

    function depositLiquidity(address token, uint256 amount) external onlyOwner {
        token.safeTransferFrom(msg.sender, address(this), amount);
        emit LiquidityDeposited(token, amount);
    }

    function withdraw(address token, address to, uint256 amount) external onlyOwner {
        token.safeTransfer(to, amount);
    }
}
