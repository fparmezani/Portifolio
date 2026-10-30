$envFile = Join-Path $PSScriptRoot ".env"
$line = Get-Content -LiteralPath $envFile | Where-Object { $_ -match '^\s*META_ACCESS_TOKEN=(.*)$' } | Select-Object -First 1
if (-not $line) { throw "Arquivo .env sem META_ACCESS_TOKEN." }
$token = ($line -replace '^\s*META_ACCESS_TOKEN=', '').Trim().Trim('"')
if (-not $token) { throw "Cole o token em tools/meta-ads/.env e salve o arquivo." }

$headers = @{ Authorization = "Bearer $token" }
$base = "https://graph.facebook.com/v26.0"

Write-Output "=== CONTAS DE ANUNCIO ==="
$accounts = Invoke-RestMethod -Headers $headers -Uri "$base/me/adaccounts?fields=id,name,account_status,currency"
$accounts.data | ForEach-Object { "{0}  {1}  moeda={2}  status={3}" -f $_.id, $_.name, $_.currency, $_.account_status }

Write-Output "=== PAGINAS ==="
$pages = Invoke-RestMethod -Headers $headers -Uri "$base/me/accounts?fields=id,name,instagram_business_account"
$pages.data | ForEach-Object {
  $ig = $_.instagram_business_account.id
  if (-not $ig) { $ig = "(sem Instagram)" }
  "{0}  {1}  instagram={2}" -f $_.id, $_.name, $ig
}
