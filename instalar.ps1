# Ganbatte: baixa (ou atualiza) e abre o jogo com um comando só, no Windows (PowerShell).
#   irm https://raw.githubusercontent.com/CaioParanaiba/ganbatte/main/instalar.ps1 | iex
# Outra pasta: $env:GANBATTE_PASTA = "C:\jogos\todo"; antes do comando acima.
# Na primeira vez, o servidor.py mostra as boas-vindas e pergunta se o jogo inicia com o computador.
$ErrorActionPreference = 'Stop'
$repo = 'https://github.com/CaioParanaiba/ganbatte'
# a pasta padrão era todo-engine até o nome Ganbatte (#15): quem já tem o jogo lá continua nela
$pasta = if ($env:GANBATTE_PASTA) { $env:GANBATTE_PASTA } elseif ($env:HUNTER_PASTA) { $env:HUNTER_PASTA }
  elseif ((Test-Path (Join-Path $HOME 'todo-engine\servidor.py')) -and -not (Test-Path (Join-Path $HOME 'ganbatte'))) { Join-Path $HOME 'todo-engine' }
  else { Join-Path $HOME 'ganbatte' }

$py = Get-Command py -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command python -ErrorAction SilentlyContinue }
if (-not $py) {
  Write-Host 'O Ganbatte precisa do Python 3: https://www.python.org/downloads/ (no instalador, marque "Add python.exe to PATH"). Depois rode este comando de novo.'
  return
}

if (Test-Path (Join-Path $pasta '.git')) {
  Write-Host "Atualizando o jogo em $pasta"
  git -C $pasta pull --ff-only
} elseif (Test-Path (Join-Path $pasta 'servidor.py')) {
  Write-Host "Atualizando o jogo em $pasta (sem git: baixando a versão nova por cima; seus dados ficam em outra pasta)"
  $zip = Join-Path $env:TEMP 'ganbatte.zip'
  $tmp = Join-Path $env:TEMP 'ganbatte-zip'
  Invoke-WebRequest "$repo/archive/refs/heads/main.zip" -OutFile $zip
  Expand-Archive $zip $tmp -Force
  Copy-Item (Join-Path (Get-ChildItem $tmp -Directory)[0].FullName '*') $pasta -Recurse -Force
  Remove-Item $zip, $tmp -Recurse -Force
} elseif (Test-Path $pasta) {
  Write-Host "A pasta $pasta já existe e não é o jogo. Escolha outra com `$env:GANBATTE_PASTA."
  return
} elseif (Get-Command git -ErrorAction SilentlyContinue) {
  Write-Host "Baixando o jogo em $pasta"
  git clone "$repo.git" $pasta
} else {
  Write-Host "Baixando o jogo em $pasta (sem git: para atualizar depois, rode este mesmo comando)"
  $zip = Join-Path $env:TEMP 'ganbatte.zip'
  $tmp = Join-Path $env:TEMP 'ganbatte-zip'
  Invoke-WebRequest "$repo/archive/refs/heads/main.zip" -OutFile $zip
  Expand-Archive $zip $tmp -Force
  Move-Item (Get-ChildItem $tmp -Directory)[0].FullName $pasta
  Remove-Item $zip, $tmp -Recurse -Force
}

Set-Location $pasta
& $py.Source servidor.py
