// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {DCAVault} from "../src/DCAVault.sol";
import {SwapRouter} from "../src/SwapRouter.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";

interface Vm {
    function warp(uint256 newTimestamp) external;
    function prank(address newSender) external;
}

contract DCAVaultTest {
    Vm internal constant vm =
        Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    DCAVault internal vault;
    SwapRouter internal router;
    MockERC20 internal usdc;
    MockERC20 internal initToken;

    address internal constant FEE_RECIPIENT = address(0xBEEF);

    function setUp() public {
        usdc = new MockERC20("USD Coin", "USDC", 18);
        initToken = new MockERC20("Initia", "INIT", 18);
        router = new SwapRouter(address(this));
        vault = new DCAVault(address(this), address(router), FEE_RECIPIENT);

        router.setPairQuote(address(usdc), address(initToken), 2e18);
        initToken.mint(address(router), 1_000_000 ether);

        usdc.mint(address(this), 10_000 ether);
        usdc.approve(address(vault), type(uint256).max);
    }

    function testCreateFundExecuteAndCompleteStrategy() public {
        setUp();

        uint256 strategyId = vault.createStrategy(address(usdc), address(initToken), 100 ether, 1 days);
        vault.fundStrategy(strategyId, 300 ether);

        vault.executeOrder(strategyId);

        (,,,,,,, uint256 remainingBalance, DCAVault.StrategyStatus status) =
            vault.strategies(strategyId);
        assertEq(remainingBalance, 200 ether, "remaining balance after first execution");
        assertEq(uint256(status), uint256(DCAVault.StrategyStatus.Active), "strategy stays active");

        vm.warp(block.timestamp + 1 days);
        vault.executeOrder(strategyId);
        vm.warp(block.timestamp + 1 days);
        vault.executeOrder(strategyId);

        (,,,,,,,, status) = vault.strategies(strategyId);
        assertEq(uint256(status), uint256(DCAVault.StrategyStatus.Completed), "strategy completes");
        assertEq(usdc.balanceOf(FEE_RECIPIENT), 0.9 ether, "fee recipient accrues fees");
        assertEq(initToken.balanceOf(address(this)), 598.2 ether, "recipient gets bought tokens");

        DCAVault.ExecutionHistory[] memory history = vault.getExecutionHistory(strategyId);
        assertEq(history.length, 3, "three executions recorded");
    }

    function testCreateAndFundAndPreviewExecution() public {
        setUp();

        uint256 strategyId =
            vault.createStrategyAndFund(address(usdc), address(initToken), 80 ether, 1 days, 400 ether);

        (uint256 amountToSwap, uint256 feePaid, uint256 expectedAmountOut) =
            vault.previewExecution(strategyId);

        assertEq(amountToSwap, 79.76 ether, "preview swap amount");
        assertEq(feePaid, 0.24 ether, "preview fee");
        assertEq(expectedAmountOut, 159.52 ether, "preview output");
    }

    function testPauseResumeAndCancelRefundsBalance() public {
        setUp();

        uint256 strategyId = vault.createStrategy(address(usdc), address(initToken), 50 ether, 12 hours);
        vault.fundStrategy(strategyId, 500 ether);

        uint256 balanceBeforeCancel = usdc.balanceOf(address(this));

        vault.pauseStrategy(strategyId);
        (,,,,,,,, DCAVault.StrategyStatus pausedStatus) = vault.strategies(strategyId);
        assertEq(
            uint256(pausedStatus), uint256(DCAVault.StrategyStatus.Paused), "strategy pauses"
        );

        vault.resumeStrategy(strategyId);
        vault.cancelStrategy(strategyId);

        (,,,,,,,, DCAVault.StrategyStatus cancelledStatus) = vault.strategies(strategyId);
        assertEq(
            uint256(cancelledStatus),
            uint256(DCAVault.StrategyStatus.Cancelled),
            "strategy cancels"
        );
        assertEq(
            usdc.balanceOf(address(this)) - balanceBeforeCancel,
            500 ether,
            "unused capital is refunded"
        );
    }

    function testThirdPartyFundingIsAllowed() public {
        setUp();

        address helper = address(0xCAFE);
        usdc.mint(helper, 300 ether);

        uint256 strategyId = vault.createStrategy(address(usdc), address(initToken), 50 ether, 12 hours);

        vm.prank(helper);
        usdc.approve(address(vault), type(uint256).max);
        vm.prank(helper);
        vault.fundStrategy(strategyId, 300 ether);

        (,,,,,,, uint256 availableBalance,) = vault.strategies(strategyId);
        assertEq(availableBalance, 300 ether, "third-party funds strategy");
    }

    function testCanExecuteTracksIntervalAndBalance() public {
        setUp();

        uint256 strategyId = vault.createStrategy(address(usdc), address(initToken), 120 ether, 1 days);
        vault.fundStrategy(strategyId, 240 ether);

        require(vault.canExecuteStrategy(strategyId), "strategy should be executable initially");
        vault.executeOrder(strategyId);
        require(!vault.canExecuteStrategy(strategyId), "interval lock should prevent early execution");

        vm.warp(block.timestamp + 1 days);
        require(vault.canExecuteStrategy(strategyId), "strategy should be executable after interval");
    }

    function assertEq(uint256 left, uint256 right, string memory reason) internal pure {
        require(left == right, reason);
    }
}
