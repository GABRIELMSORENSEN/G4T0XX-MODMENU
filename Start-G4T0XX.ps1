param([int]$VerificationPort = 0)
$ErrorActionPreference = 'Stop'
$runtimeRoot = [IO.Path]::GetFullPath($PSScriptRoot)
$executable = Join-Path $runtimeRoot 'G4T0XX_MOD_MENU.exe'
if (-not (Test-Path -LiteralPath $executable -PathType Leaf)) {
    throw 'Extraia o pacote completo da release antes de iniciar. O executavel precisa ficar junto de resources e das DLLs.'
}

$stateRoot = [IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA 'G4T0XX/Modmenu'))
$profilePath = [IO.Path]::GetFullPath((Join-Path $stateRoot 'Profile'))
New-Item -ItemType Directory -Path $stateRoot -Force | Out-Null
$identitySid = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
& icacls $stateRoot /inheritance:r /grant:r "*$($identitySid):(OI)(CI)F" '*S-1-5-18:(OI)(CI)F' 2>$null | Out-Null

if (-not (Test-Path -LiteralPath $profilePath)) {
    $sourceProfile = @(
        (Join-Path $env:APPDATA 'WeMod'),
        (Join-Path $env:APPDATA 'G4T0XX MOD MENU')
    ) | Where-Object { Test-Path -LiteralPath (Join-Path $_ 'App') } | Select-Object -First 1
    $incoming = [IO.Path]::GetFullPath((Join-Path $stateRoot ('Profile.incoming-' + [guid]::NewGuid().ToString('N'))))
    $boundary = $stateRoot.TrimEnd('\', '/') + [IO.Path]::DirectorySeparatorChar
    if (-not $incoming.StartsWith($boundary, [StringComparison]::OrdinalIgnoreCase) -or
        -not $profilePath.StartsWith($boundary, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Caminho de perfil invalido.'
    }
    New-Item -ItemType Directory -Path $incoming | Out-Null
    if ($sourceProfile) {
        # A local copy preserves the original profile and its valid authentication.
        # No credentials are embedded in this launcher or the distributed package.
        foreach ($name in @('App', 'Local Storage', 'IndexedDB', 'Network', 'Session Storage', 'databases', 'Local State', 'Preferences', 'Cookies')) {
            $sourceItem = Join-Path $sourceProfile $name
            if (Test-Path -LiteralPath $sourceItem) {
                Copy-Item -LiteralPath $sourceItem -Destination $incoming -Recurse -Force
            }
        }
    }
    Move-Item -LiteralPath $incoming -Destination $profilePath
}

# Reuse an already running instance before touching its profile or generated caches.
$activeInstance = Get-CimInstance Win32_Process -Filter "Name='G4T0XX_MOD_MENU.exe'" |
    Where-Object { $_.CommandLine -and $_.CommandLine.IndexOf($profilePath, [StringComparison]::OrdinalIgnoreCase) -ge 0 -and $_.CommandLine -notmatch '--type=' } |
    Select-Object -First 1
if ($activeInstance) {
    Write-Output 'G4T0XX MOD MENU ja esta aberto com este perfil.'
    exit 0
}

# Restricted Chromium child processes need RX on application files, not on the user's profile.
& icacls $runtimeRoot /grant '*S-1-15-2-1:RX' '*S-1-15-2-2:RX' 2>$null | Out-Null
Get-ChildItem -LiteralPath $runtimeRoot -File | Where-Object { $_.Extension -in @('.exe', '.dll', '.pak', '.bin', '.dat') } | ForEach-Object {
    & icacls $_.FullName /grant '*S-1-15-2-1:RX' '*S-1-15-2-2:RX' 2>$null | Out-Null
}
foreach ($directory in @('resources', 'locales', 'swiftshader')) {
    $codeDirectory = Join-Path $runtimeRoot $directory
    if (Test-Path -LiteralPath $codeDirectory -PathType Container) {
        & icacls $codeDirectory /grant '*S-1-15-2-1:(OI)(CI)RX' '*S-1-15-2-2:(OI)(CI)RX' /T /Q 2>$null | Out-Null
    }
}

$launchArguments = @('--disable-gpu', ('--user-data-dir="' + $profilePath + '"'))
if ($VerificationPort -gt 0 -and $VerificationPort -lt 65536) {
    $launchArguments += '--remote-debugging-port=' + $VerificationPort
}
$inheritedNodeMode = $env:ELECTRON_RUN_AS_NODE
try {
    Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
    $application = Start-Process -FilePath $executable -ArgumentList $launchArguments -WorkingDirectory $runtimeRoot -WindowStyle Normal -PassThru
    @{ pid = $application.Id; started = [DateTime]::UtcNow.ToString('o'); verificationPort = $VerificationPort } |
        ConvertTo-Json | Set-Content -LiteralPath (Join-Path $stateRoot 'last-launch.json') -Encoding UTF8
} finally {
    if ($null -ne $inheritedNodeMode) { $env:ELECTRON_RUN_AS_NODE = $inheritedNodeMode }
}
