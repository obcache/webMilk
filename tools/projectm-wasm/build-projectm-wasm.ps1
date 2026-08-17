param(
  [string]$ProjectMRoot = "E:\Production\Coding\projectm",
  [string]$BuildDir = ".tmp\projectm-wasm-build",
  [string]$OutputDir = "public\vendor\projectm",
  [string]$SourceOutputDir = "src\vendor\projectm"
)

$ErrorActionPreference = "Stop"

function Require-Command($Name) {
  $cmd = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $cmd) {
    Write-Host "[webMilk] $Name was not found on PATH. Install/activate Emscripten before running this script." -ForegroundColor Red
    exit 1
  }
  return $cmd
}

function Invoke-Native($FilePath, [string[]]$Arguments) {
  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$FilePath failed with exit code $LASTEXITCODE."
  }
}

function Get-CMakeGeneratorArgs() {
  if (Get-Command "ninja" -ErrorAction SilentlyContinue) {
    return @("-G", "Ninja")
  }
  if (Get-Command "mingw32-make" -ErrorAction SilentlyContinue) {
    return @("-G", "MinGW Makefiles")
  }
  Write-Host "[webMilk] No Emscripten-compatible CMake generator was found." -ForegroundColor Red
  Write-Host "[webMilk] Install Ninja and ensure ninja.exe is on PATH, or install MinGW and ensure mingw32-make.exe is on PATH." -ForegroundColor Red
  exit 1
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$adapterRoot = Join-Path $repoRoot "wasm\projectm-adapter"
$projectMRootResolved = Resolve-Path -LiteralPath $ProjectMRoot
$buildDirFull = Join-Path $repoRoot $BuildDir
$outputDirFull = Join-Path $repoRoot $OutputDir
$sourceOutputDirFull = Join-Path $repoRoot $SourceOutputDir

Require-Command "emcmake" | Out-Null
Require-Command "emmake" | Out-Null
Require-Command "cmake" | Out-Null
$generatorArgs = Get-CMakeGeneratorArgs

New-Item -ItemType Directory -Force -Path $buildDirFull | Out-Null
New-Item -ItemType Directory -Force -Path $outputDirFull | Out-Null
New-Item -ItemType Directory -Force -Path $sourceOutputDirFull | Out-Null

Push-Location $repoRoot
try {
  $configureArgs = @(
    "cmake",
    "-S", "$adapterRoot",
    "-B", "$buildDirFull"
  )
  $configureArgs += $generatorArgs
  $configureArgs += @(
    "-DCMAKE_BUILD_TYPE=Release",
    "-DPROJECTM_ROOT:PATH=$projectMRootResolved"
  )

  Write-Host "[webMilk] Configuring ProjectM WASM:"
  Write-Host "[webMilk] emcmake $($configureArgs -join ' ')"
  Invoke-Native "emcmake" $configureArgs

  Invoke-Native "emmake" @("cmake", "--build", "$buildDirFull", "--config", "Release")

  $outputs = Get-ChildItem -Path $buildDirFull -Recurse -Include "webmilk-projectm.js","webmilk-projectm.wasm","webmilk-projectm.data" -ErrorAction SilentlyContinue
  if (-not $outputs) {
    throw "ProjectM WASM build completed, but no webmilk-projectm output files were found under $buildDirFull."
  }

  foreach ($output in $outputs) {
    Copy-Item -LiteralPath $output.FullName -Destination $outputDirFull -Force
    Copy-Item -LiteralPath $output.FullName -Destination $sourceOutputDirFull -Force
  }

  Write-Host "[webMilk] ProjectM WASM artifacts copied to $outputDirFull"
  Write-Host "[webMilk] ProjectM WASM source-import artifacts copied to $sourceOutputDirFull"
} finally {
  Pop-Location
}
