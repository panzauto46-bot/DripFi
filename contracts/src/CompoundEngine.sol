// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SafeTransferLib} from "./libraries/SafeTransferLib.sol";
import {Owned} from "./libraries/Owned.sol";

contract CompoundEngine is Owned {
    using SafeTransferLib for address;

    struct Position {
        address owner;
        address rewardToken;
        address depositToken;
        uint64 compoundInterval;
        uint64 lastCompoundedAt;
        uint256 pendingRewards;
        uint256 compoundedAmount;
        bool active;
    }

    error InvalidPosition();
    error NotPositionOwner();
    error InvalidInterval();
    error PositionInactive();
    error NotReady();

    event PositionRegistered(
        uint256 indexed positionId,
        address indexed owner,
        address indexed rewardToken,
        address depositToken,
        uint64 compoundInterval
    );
    event RewardsFunded(uint256 indexed positionId, uint256 amount);
    event RewardsCompounded(uint256 indexed positionId, uint256 amount);
    event CompoundIntervalUpdated(uint256 indexed positionId, uint64 compoundInterval);
    event PositionStatusUpdated(uint256 indexed positionId, bool active);
    event CompoundFeeUpdated(uint16 compoundFeeBps);
    event FeeRecipientUpdated(address indexed feeRecipient);

    uint256 public positionCount;
    uint16 public compoundFeeBps = 500;
    address public feeRecipient;

    mapping(uint256 positionId => Position) public positions;
    mapping(address owner => uint256[]) private ownerPositionIds;

    modifier onlyPositionOwner(uint256 positionId) {
        if (positions[positionId].owner != msg.sender) revert NotPositionOwner();
        _;
    }

    constructor(address initialOwner, address initialFeeRecipient) Owned(initialOwner) {
        feeRecipient = initialFeeRecipient == address(0) ? initialOwner : initialFeeRecipient;
    }

    function registerPosition(
        address rewardToken,
        address depositToken,
        uint64 compoundInterval
    ) external returns (uint256 positionId) {
        if (compoundInterval == 0) revert InvalidInterval();

        positionId = ++positionCount;
        positions[positionId] = Position({
            owner: msg.sender,
            rewardToken: rewardToken,
            depositToken: depositToken,
            compoundInterval: compoundInterval,
            lastCompoundedAt: 0,
            pendingRewards: 0,
            compoundedAmount: 0,
            active: true
        });
        ownerPositionIds[msg.sender].push(positionId);

        emit PositionRegistered(positionId, msg.sender, rewardToken, depositToken, compoundInterval);
    }

    function fundRewards(uint256 positionId, uint256 amount) external {
        Position storage position = positions[positionId];
        if (position.owner == address(0)) revert InvalidPosition();

        position.rewardToken.safeTransferFrom(msg.sender, address(this), amount);
        position.pendingRewards += amount;

        emit RewardsFunded(positionId, amount);
    }

    function compound(uint256 positionId) external returns (uint256 amountCompounded) {
        Position storage position = positions[positionId];
        if (position.owner == address(0)) revert InvalidPosition();
        if (!position.active) revert PositionInactive();
        if (
            position.lastCompoundedAt != 0
                && block.timestamp < position.lastCompoundedAt + position.compoundInterval
        ) revert NotReady();

        uint256 pendingRewards = position.pendingRewards;
        uint256 feeAmount = pendingRewards * compoundFeeBps / 10_000;
        amountCompounded = pendingRewards - feeAmount;

        position.pendingRewards = 0;
        position.compoundedAmount += amountCompounded;
        position.lastCompoundedAt = uint64(block.timestamp);

        if (feeAmount != 0) {
            position.rewardToken.safeTransfer(feeRecipient, feeAmount);
        }

        emit RewardsCompounded(positionId, amountCompounded);
    }

    function setCompoundInterval(uint256 positionId, uint64 compoundInterval)
        external
        onlyPositionOwner(positionId)
    {
        if (compoundInterval == 0) revert InvalidInterval();
        positions[positionId].compoundInterval = compoundInterval;
        emit CompoundIntervalUpdated(positionId, compoundInterval);
    }

    function setPositionStatus(uint256 positionId, bool active)
        external
        onlyPositionOwner(positionId)
    {
        positions[positionId].active = active;
        emit PositionStatusUpdated(positionId, active);
    }

    function setCompoundFeeBps(uint16 newCompoundFeeBps) external onlyOwner {
        require(newCompoundFeeBps <= 2_000, "FEE_TOO_HIGH");
        compoundFeeBps = newCompoundFeeBps;
        emit CompoundFeeUpdated(newCompoundFeeBps);
    }

    function setFeeRecipient(address newFeeRecipient) external onlyOwner {
        feeRecipient = newFeeRecipient;
        emit FeeRecipientUpdated(newFeeRecipient);
    }

    function getPositionIdsByOwner(address owner) external view returns (uint256[] memory) {
        return ownerPositionIds[owner];
    }
}
