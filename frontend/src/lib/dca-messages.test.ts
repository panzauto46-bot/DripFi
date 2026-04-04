import test from "node:test";
import assert from "node:assert/strict";
import type { Address } from "viem";
import { buildApproveInput, buildAutoSignFee, buildCreateStrategyAndFundInput, buildMsgCallMessage, buildVaultActionInput } from "@/lib/dca-messages";

const user = "init1testuser000000000000000000000000000000" as string;
const vault = "0x00000000000000000000000000000000000000aa" as Address;
const usdc = "0x00000000000000000000000000000000000000bb" as Address;
const initToken = "0x00000000000000000000000000000000000000cc" as Address;

test("buildMsgCallMessage wraps MiniEVM call payload correctly", () => {
  const message = buildMsgCallMessage({
    sender: user,
    contractAddr: vault,
    input: "0x1234",
  });

  assert.equal(message.typeUrl, "/minievm.evm.v1.MsgCall");
  assert.equal(message.value.sender, user.toLowerCase());
  assert.equal(message.value.contractAddr, vault);
  assert.equal(message.value.input, "0x1234");
});

test("approve and create strategy inputs encode non-empty calldata", () => {
  const approveInput = buildApproveInput(vault, 1000n);
  const createInput = buildCreateStrategyAndFundInput({
    tokenIn: usdc,
    tokenOut: initToken,
    amountPerOrder: "10",
    budget: "250",
    decimals: 18,
    intervalInSeconds: 60 * 60 * 24,
  });

  assert.ok(approveInput.startsWith("0x"));
  assert.ok(createInput.startsWith("0x"));
  assert.notEqual(buildVaultActionInput("pauseStrategy", 1n), "0x");
});

test("buildAutoSignFee creates a cosmos fee object", () => {
  const fee = buildAutoSignFee({
    gasEstimate: 210000,
    denom: "uinit",
    gasPrice: "0.015",
  });

  assert.equal(fee.gas, "262500");
  assert.equal(fee.amount[0]?.denom, "uinit");
});
