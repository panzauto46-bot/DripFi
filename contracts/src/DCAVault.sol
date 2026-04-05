// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";
import {ISwapRouter} from "./interfaces/ISwapRouter.sol";
import {SafeTransferLib} from "./libraries/SafeTransferLib.sol";
import {Owned} from "./libraries/Owned.sol";

contract DCAVault is Owned {
    using SafeTransferLib for address;

    uint16 public constant MAX_BPS = 10_000;

    enum StrategyStatus {
        Active,
        Paused,
        Cancelled,
        Completed
    }

    struct Strategy {
        address owner;
        address tokenIn;
        address tokenOut;
        address recipient;
        uint256 amountPerOrder;
        uint64 interval;
        uint64 lastExecutedAt;
        uint256 availableBalance;
        StrategyStatus status;
    }

    struct ExecutionHistory {
        uint64 executedAt;
        uint256 amountIn;
        uint256 feePaid;
        uint256 amountOut;
    }

    error InvalidAmount();
    error InvalidInterval();
    error InvalidStrategy();
    error NotStrategyOwner();
    error StrategyNotActive();
    error StrategyNotPaused();
    error StrategyFinalized();
    error StrategyNotReady();
    error InsufficientStrategyBalance();
    error RouterNotConfigured();
    error InvalidRecipient();
    error ExecutionUnauthorized();

    event StrategyCreated(
        uint256 indexed strategyId,
        address indexed owner,
        address indexed tokenIn,
        address tokenOut,
        uint256 amountPerOrder,
        uint64 interval
    );
    event StrategyFunded(uint256 indexed strategyId, uint256 amount, uint256 newBalance);
    event StrategyExecuted(
        uint256 indexed strategyId,
        uint256 amountIn,
        uint256 feePaid,
        uint256 amountOut
    );
    event StrategyPaused(uint256 indexed strategyId);
    event StrategyResumed(uint256 indexed strategyId);
    event StrategyCancelled(uint256 indexed strategyId, uint256 refundedAmount);
    event StrategyWithdrawn(uint256 indexed strategyId, uint256 amount);
    event FeeRecipientUpdated(address indexed feeRecipient);
    event ExecutionFeeUpdated(uint16 executionFeeBps);
    event SwapRouterUpdated(address indexed router);
    event SessionKeyUpdated(address indexed user, address indexed sessionKey, bool approved);
    event StrategyRecipientUpdated(uint256 indexed strategyId, address indexed recipient);

    uint256 public strategyCount;
    uint16 public executionFeeBps = 30;
    address public feeRecipient;
    ISwapRouter public swapRouter;

    mapping(uint256 strategyId => Strategy) public strategies;
    mapping(uint256 strategyId => ExecutionHistory[]) private executionHistory;
    mapping(address user => mapping(address sessionKey => bool)) public approvedSessionKeys;
    mapping(address owner => uint256[]) private ownerStrategyIds;

    uint256 private locked = 1;

    modifier nonReentrant() {
        require(locked == 1, "REENTRANCY");
        locked = 2;
        _;
        locked = 1;
    }

    modifier onlyStrategyOwner(uint256 strategyId) {
        if (strategies[strategyId].owner != msg.sender) revert NotStrategyOwner();
        _;
    }

    constructor(address initialOwner, address initialRouter, address initialFeeRecipient)
        Owned(initialOwner)
    {
        swapRouter = ISwapRouter(initialRouter);
        feeRecipient = initialFeeRecipient == address(0) ? initialOwner : initialFeeRecipient;
    }

    function createStrategy(
        address tokenIn,
        address tokenOut,
        uint256 amountPerOrder,
        uint64 interval
    ) external returns (uint256 strategyId) {
        strategyId = _createStrategy(msg.sender, tokenIn, tokenOut, msg.sender, amountPerOrder, interval);
    }

    function createStrategyWithRecipient(
        address tokenIn,
        address tokenOut,
        address recipient,
        uint256 amountPerOrder,
        uint64 interval
    ) external returns (uint256 strategyId) {
        strategyId = _createStrategy(msg.sender, tokenIn, tokenOut, recipient, amountPerOrder, interval);
    }

    function createStrategyAndFund(
        address tokenIn,
        address tokenOut,
        uint256 amountPerOrder,
        uint64 interval,
        uint256 initialAmount
    ) external nonReentrant returns (uint256 strategyId) {
        strategyId = _createStrategy(msg.sender, tokenIn, tokenOut, msg.sender, amountPerOrder, interval);
        if (initialAmount != 0) {
            _fundStrategy(strategyId, tokenIn, msg.sender, initialAmount);
        }
    }

    function _createStrategy(
        address owner,
        address tokenIn,
        address tokenOut,
        address recipient,
        uint256 amountPerOrder,
        uint64 interval
    ) internal returns (uint256 strategyId) {
        if (amountPerOrder == 0) revert InvalidAmount();
        if (interval == 0) revert InvalidInterval();
        if (recipient == address(0)) revert InvalidRecipient();

        strategyId = ++strategyCount;
        strategies[strategyId] = Strategy({
            owner: owner,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            recipient: recipient,
            amountPerOrder: amountPerOrder,
            interval: interval,
            lastExecutedAt: 0,
            availableBalance: 0,
            status: StrategyStatus.Active
        });
        ownerStrategyIds[owner].push(strategyId);

        emit StrategyCreated(strategyId, owner, tokenIn, tokenOut, amountPerOrder, interval);
    }

    function fundStrategy(uint256 strategyId, uint256 amount) external nonReentrant {
        Strategy storage strategy = strategies[strategyId];
        if (strategy.owner == address(0)) revert InvalidStrategy();
        if (
            strategy.status == StrategyStatus.Cancelled
                || strategy.status == StrategyStatus.Completed
        ) revert StrategyFinalized();

        _fundStrategy(strategyId, strategy.tokenIn, msg.sender, amount);
    }

    function _fundStrategy(
        uint256 strategyId,
        address tokenIn,
        address funder,
        uint256 amount
    ) internal {
        if (amount == 0) revert InvalidAmount();
        tokenIn.safeTransferFrom(funder, address(this), amount);
        strategies[strategyId].availableBalance += amount;

        emit StrategyFunded(strategyId, amount, strategies[strategyId].availableBalance);
    }

    function executeOrder(uint256 strategyId) external nonReentrant returns (uint256 amountOut) {
        amountOut = _executeOrder(strategyId, 0);
    }

    function executeOrderWithMinOut(uint256 strategyId, uint256 minAmountOut)
        external
        nonReentrant
        returns (uint256 amountOut)
    {
        amountOut = _executeOrder(strategyId, minAmountOut);
    }

    function _executeOrder(uint256 strategyId, uint256 minAmountOut)
        internal
        returns (uint256 amountOut)
    {
        Strategy storage strategy = strategies[strategyId];
        if (strategy.owner == address(0)) revert InvalidStrategy();
        if (!_isExecutionAuthorized(strategy, msg.sender)) revert ExecutionUnauthorized();
        if (strategy.status != StrategyStatus.Active) revert StrategyNotActive();
        if (address(swapRouter) == address(0)) revert RouterNotConfigured();
        if (strategy.availableBalance < strategy.amountPerOrder) revert InsufficientStrategyBalance();

        uint64 lastExecutedAt = strategy.lastExecutedAt;
        if (lastExecutedAt != 0 && block.timestamp < lastExecutedAt + strategy.interval) {
            revert StrategyNotReady();
        }

        uint256 feePaid = strategy.amountPerOrder * executionFeeBps / MAX_BPS;
        uint256 amountToSwap = strategy.amountPerOrder - feePaid;

        strategy.availableBalance -= strategy.amountPerOrder;
        strategy.lastExecutedAt = uint64(block.timestamp);

        if (feePaid != 0) {
            strategy.tokenIn.safeTransfer(feeRecipient, feePaid);
        }

        strategy.tokenIn.safeApprove(address(swapRouter), 0);
        strategy.tokenIn.safeApprove(address(swapRouter), amountToSwap);
        amountOut = swapRouter.swap(
            strategy.tokenIn, strategy.tokenOut, amountToSwap, strategy.recipient, minAmountOut
        );

        executionHistory[strategyId].push(
            ExecutionHistory({
                executedAt: uint64(block.timestamp),
                amountIn: amountToSwap,
                feePaid: feePaid,
                amountOut: amountOut
            })
        );

        if (strategy.availableBalance < strategy.amountPerOrder) {
            strategy.status = StrategyStatus.Completed;
        }

        emit StrategyExecuted(strategyId, amountToSwap, feePaid, amountOut);
    }

    function pauseStrategy(uint256 strategyId) external onlyStrategyOwner(strategyId) {
        Strategy storage strategy = strategies[strategyId];
        if (strategy.status != StrategyStatus.Active) revert StrategyNotActive();
        strategy.status = StrategyStatus.Paused;
        emit StrategyPaused(strategyId);
    }

    function resumeStrategy(uint256 strategyId) external onlyStrategyOwner(strategyId) {
        Strategy storage strategy = strategies[strategyId];
        if (strategy.status != StrategyStatus.Paused) revert StrategyNotPaused();
        strategy.status = StrategyStatus.Active;
        emit StrategyResumed(strategyId);
    }

    function cancelStrategy(uint256 strategyId)
        external
        nonReentrant
        onlyStrategyOwner(strategyId)
    {
        Strategy storage strategy = strategies[strategyId];
        if (
            strategy.status == StrategyStatus.Cancelled
                || strategy.status == StrategyStatus.Completed
        ) revert StrategyFinalized();

        uint256 refund = strategy.availableBalance;
        strategy.availableBalance = 0;
        strategy.status = StrategyStatus.Cancelled;

        if (refund != 0) {
            strategy.tokenIn.safeTransfer(strategy.owner, refund);
        }

        emit StrategyCancelled(strategyId, refund);
    }

    function withdrawFunds(uint256 strategyId)
        external
        nonReentrant
        onlyStrategyOwner(strategyId)
        returns (uint256 amount)
    {
        Strategy storage strategy = strategies[strategyId];
        amount = strategy.availableBalance;
        strategy.availableBalance = 0;

        if (amount != 0) {
            strategy.tokenIn.safeTransfer(strategy.owner, amount);
        }

        if (strategy.status == StrategyStatus.Active || strategy.status == StrategyStatus.Paused) {
            strategy.status = StrategyStatus.Completed;
        }

        emit StrategyWithdrawn(strategyId, amount);
    }

    function setStrategyRecipient(uint256 strategyId, address recipient)
        external
        onlyStrategyOwner(strategyId)
    {
        if (recipient == address(0)) revert InvalidRecipient();
        strategies[strategyId].recipient = recipient;
        emit StrategyRecipientUpdated(strategyId, recipient);
    }

    function setSwapRouter(address newRouter) external onlyOwner {
        swapRouter = ISwapRouter(newRouter);
        emit SwapRouterUpdated(newRouter);
    }

    function setFeeRecipient(address newFeeRecipient) external onlyOwner {
        feeRecipient = newFeeRecipient;
        emit FeeRecipientUpdated(newFeeRecipient);
    }

    function setExecutionFeeBps(uint16 newExecutionFeeBps) external onlyOwner {
        require(newExecutionFeeBps <= 500, "FEE_TOO_HIGH");
        executionFeeBps = newExecutionFeeBps;
        emit ExecutionFeeUpdated(newExecutionFeeBps);
    }

    function setSessionKey(address sessionKey, bool approved) external {
        approvedSessionKeys[msg.sender][sessionKey] = approved;
        emit SessionKeyUpdated(msg.sender, sessionKey, approved);
    }

    function isExecutionAuthorized(uint256 strategyId, address executor)
        external
        view
        returns (bool)
    {
        Strategy storage strategy = strategies[strategyId];
        if (strategy.owner == address(0)) revert InvalidStrategy();
        return _isExecutionAuthorized(strategy, executor);
    }

    function nextExecutionAt(uint256 strategyId) external view returns (uint256) {
        Strategy storage strategy = strategies[strategyId];
        if (strategy.owner == address(0)) revert InvalidStrategy();
        if (strategy.lastExecutedAt == 0) {
            return block.timestamp;
        }
        return strategy.lastExecutedAt + strategy.interval;
    }

    function canExecuteStrategy(uint256 strategyId) external view returns (bool) {
        Strategy storage strategy = strategies[strategyId];
        if (strategy.owner == address(0)) revert InvalidStrategy();
        if (strategy.status != StrategyStatus.Active) return false;
        if (address(swapRouter) == address(0)) return false;
        if (strategy.availableBalance < strategy.amountPerOrder) return false;

        uint64 lastExecutedAt = strategy.lastExecutedAt;
        return lastExecutedAt == 0 || block.timestamp >= lastExecutedAt + strategy.interval;
    }

    function previewExecution(uint256 strategyId)
        external
        view
        returns (uint256 amountToSwap, uint256 feePaid, uint256 expectedAmountOut)
    {
        Strategy storage strategy = strategies[strategyId];
        if (strategy.owner == address(0)) revert InvalidStrategy();
        if (strategy.availableBalance < strategy.amountPerOrder) revert InsufficientStrategyBalance();

        feePaid = strategy.amountPerOrder * executionFeeBps / MAX_BPS;
        amountToSwap = strategy.amountPerOrder - feePaid;
        expectedAmountOut = swapRouter.getAmountOut(strategy.tokenIn, strategy.tokenOut, amountToSwap);
    }

    function getStrategyIdsByOwner(address owner) external view returns (uint256[] memory) {
        return ownerStrategyIds[owner];
    }

    function getExecutionHistory(uint256 strategyId)
        external
        view
        returns (ExecutionHistory[] memory)
    {
        return executionHistory[strategyId];
    }

    function _isExecutionAuthorized(Strategy storage strategy, address executor)
        internal
        view
        returns (bool)
    {
        return executor == strategy.owner || approvedSessionKeys[strategy.owner][executor];
    }
}
