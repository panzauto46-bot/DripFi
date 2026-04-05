param(
  [string]$EnvPath = (Join-Path (Resolve-Path "$PSScriptRoot\..\..") ".env.local"),
  [string]$RpcUrl = "http://127.0.0.1:26657",
  [string]$RestUrl = "http://127.0.0.1:1317",
  [string]$IndexerUrl = "http://127.0.0.1:8080",
  [string]$JsonRpcUrl = "http://127.0.0.1:8545",
  [string]$DcaVaultAddress = "0x0000000000000000000000000000000000000000",
  [string]$SwapRouterAddress = "0x0000000000000000000000000000000000000000",
  [string]$CompoundEngineAddress = "0x0000000000000000000000000000000000000000",
  [string]$UsdcAddress = "0x0000000000000000000000000000000000000000",
  [string]$InitTokenAddress = "0x0000000000000000000000000000000000000000",
  [string]$AutomationRelayerAddress = "0x0000000000000000000000000000000000000000"
)

$repoRoot = Resolve-Path "$PSScriptRoot\..\.."
$envExamplePath = Join-Path $repoRoot ".env.example"

if (-not (Test-Path $EnvPath)) {
  Copy-Item $envExamplePath $EnvPath
}

$content = Get-Content $EnvPath -Raw

function Set-EnvValue {
  param(
    [string]$Name,
    [string]$Value
  )

  if ($script:content -match "(?m)^$Name=") {
    $script:content = [Regex]::Replace($script:content, "(?m)^$Name=.*$", "$Name=$Value")
  } else {
    $script:content = ($script:content.TrimEnd() + "`r`n$Name=$Value`r`n")
  }
}

Set-EnvValue "NEXT_PUBLIC_RPC_URL" $RpcUrl
Set-EnvValue "NEXT_PUBLIC_REST_URL" $RestUrl
Set-EnvValue "NEXT_PUBLIC_INDEXER_URL" $IndexerUrl
Set-EnvValue "NEXT_PUBLIC_JSON_RPC_URL" $JsonRpcUrl
Set-EnvValue "NEXT_PUBLIC_DCA_VAULT_ADDRESS" $DcaVaultAddress
Set-EnvValue "NEXT_PUBLIC_SWAP_ROUTER_ADDRESS" $SwapRouterAddress
Set-EnvValue "NEXT_PUBLIC_COMPOUND_ENGINE_ADDRESS" $CompoundEngineAddress
Set-EnvValue "NEXT_PUBLIC_USDC_ADDRESS" $UsdcAddress
Set-EnvValue "NEXT_PUBLIC_INIT_TOKEN_ADDRESS" $InitTokenAddress
Set-EnvValue "NEXT_PUBLIC_AUTOMATION_RELAYER_ADDRESS" $AutomationRelayerAddress

Set-Content -Path $EnvPath -Value $content

Write-Host "Updated $EnvPath" -ForegroundColor Green
Write-Host "Review the remaining values before redeploying Vercel." -ForegroundColor Yellow
