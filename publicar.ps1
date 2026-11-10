# ============================================================================
# publicar.ps1 - sincroniza a versao publica do site na pasta docs/
#
# O que faz:
#   1. copia index.html, css/style.css e js/{icons,data,main}.js para docs/;
#   2. remove o link "Area do administrador" de docs/index.html;
#   3. remove docs/admin.html, caso exista;
#   4. garante o arquivo docs/.nojekyll;
#   5. mostra os comandos de commit.
#
# Como usar (na raiz do projeto):
#   powershell -ExecutionPolicy Bypass -File .\publicar.ps1
# ============================================================================

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$docs = Join-Path $root "docs"

Write-Host ""
Write-Host "Schesman Advocacia - publicacao em docs/" -ForegroundColor Cyan
Write-Host ""

$files = @(
  @{ Source = "index.html";    Target = "index.html" },
  @{ Source = "css\style.css"; Target = "css\style.css" },
  @{ Source = "js\icons.js";   Target = "js\icons.js" },
  @{ Source = "js\data.js";    Target = "js\data.js" },
  @{ Source = "js\main.js";    Target = "js\main.js" }
)

foreach ($item in $files) {
  $source = Join-Path $root $item.Source
  if (-not (Test-Path -LiteralPath $source)) {
    throw "Arquivo nao encontrado: $($item.Source)"
  }
}

New-Item -ItemType Directory -Force -Path (Join-Path $docs "css") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $docs "js") | Out-Null

foreach ($item in $files) {
  $source = Join-Path $root $item.Source
  $target = Join-Path $docs $item.Target
  Copy-Item -LiteralPath $source -Destination $target -Force
  Write-Host ("  ok  {0} -> docs/{1}" -f $item.Source, $item.Target)
}

# Remove o link de administrador da versao publicada.
$indexPath = Join-Path $docs "index.html"
$content = Get-Content -LiteralPath $indexPath -Raw -Encoding UTF8
$adminLinkPattern = '(?s)\s*<a\s+href="admin\.html"\s+class="footer__admin"[^>]*>.*?</a>'
$newContent = [regex]::Replace($content, $adminLinkPattern, "")

if ($newContent -ne $content) {
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($indexPath, $newContent, $utf8NoBom)
  Write-Host "  ok  link de administrador removido de docs/index.html"
} elseif ($newContent -match "admin\.html") {
  throw "Ainda existe referencia a admin.html em docs/index.html. Remova manualmente antes de publicar."
} else {
  Write-Host "  ok  docs/index.html ja esta sem link de administrador"
}

# O painel nunca deve ser publicado.
$adminPath = Join-Path $docs "admin.html"
if (Test-Path -LiteralPath $adminPath) {
  Remove-Item -LiteralPath $adminPath -Force
  Write-Host "  ok  docs/admin.html removido (o painel nao deve ser publicado)" -ForegroundColor Yellow
}

# Evita o processamento pelo Jekyll.
$nojekyllPath = Join-Path $docs ".nojekyll"
if (-not (Test-Path -LiteralPath $nojekyllPath)) {
  New-Item -ItemType File -Path $nojekyllPath | Out-Null
  Write-Host "  ok  docs/.nojekyll criado"
}

Write-Host ""
Write-Host "Versao publica sincronizada." -ForegroundColor Green
Write-Host ""
Write-Host "Revise e envie:"
Write-Host "  git status"
Write-Host "  git add docs"
Write-Host '  git commit -m "Atualiza o site publicado"'
Write-Host "  git push"
Write-Host ""
