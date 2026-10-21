# Compile l'application Android sans Gradle, avec les outils du SDK Android :
#   - Telecommande-PPT.apk : à installer directement (site web)
#   - android\Telecommande-PPT.aab : App Bundle à envoyer sur Google Play
# Usage : powershell -ExecutionPolicy Bypass -File android\build-apk.ps1
$ErrorActionPreference = 'Stop'

# ---- Version et identité de l'application (à augmenter à chaque envoi sur Google Play) ----
$appId       = 'com.amineamahan.telecommandeppt'
$versionCode = '5'
$versionName = '1.4'
$minSdk      = '28'
$targetSdk   = '36'
$bundletoolVersion = '1.18.3'

$here = $PSScriptRoot
$sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { "$env:LOCALAPPDATA\Android\Sdk" }
$bt = Get-ChildItem "$sdk\build-tools" | Where-Object Name -notmatch 'rc' | Sort-Object { [version]$_.Name } | Select-Object -Last 1 -ExpandProperty FullName
$platform = Get-ChildItem "$sdk\platforms" | Sort-Object { [int]($_.Name -replace '\D', '') } | Select-Object -Last 1 -ExpandProperty FullName
$jar = "$platform\android.jar"
$build = "$here\build"
$apkOut = Join-Path (Split-Path $here) 'Telecommande-PPT.apk'
$aabOut = "$here\Telecommande-PPT.aab"

function Run([string]$exe, [string[]]$a) { & $exe $a; if ($LASTEXITCODE -ne 0) { throw "Échec : $exe" } }

# Outils Java (keytool, jarsigner) du JDK installé
$jdkBin = (Get-Command keytool -ErrorAction SilentlyContinue).Source
if ($jdkBin) { $jdkBin = Split-Path $jdkBin } else {
    $jdkBin = Get-ChildItem 'C:\Program Files\Java', 'C:\Program Files\Eclipse Adoptium', 'C:\Program Files\Android\Android Studio\jbr' `
        -Recurse -Filter keytool.exe -ErrorAction SilentlyContinue | Select-Object -First 1 | ForEach-Object DirectoryName
}

# Mot de passe de la clé : fichier local android\keystore.password (jamais publié), sinon variable d'environnement
$passFile = "$here\keystore.password"
$pass = if (Test-Path $passFile) { (Get-Content $passFile -Raw).Trim() } elseif ($env:PPT_KEYSTORE_PASS) { $env:PPT_KEYSTORE_PASS } else { $null }
$ks = "$here\ppt-remote.keystore"
if (-not (Test-Path $ks)) {
    if (-not $pass) {
        $pass = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 24 | ForEach-Object { [char]$_ })
        Set-Content $passFile $pass -NoNewline
    }
    Run "$jdkBin\keytool.exe" @('-genkeypair', '-keystore', $ks, '-alias', 'pptremote', '-keyalg', 'RSA', '-keysize', '2048', '-validity', '10000',
        '-storepass', $pass, '-keypass', $pass, '-dname', 'CN=AMINE AMAHAN')
}
if (-not $pass) { throw "Mot de passe de la clé introuvable : créez $passFile" }

Write-Host "build-tools : $bt`nplateforme  : $platform`nappli       : $appId $versionName ($versionCode)"
Remove-Item $build -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force "$build\classes", "$build\dex" | Out-Null
$linkArgs = @('-I', $jar, '--manifest', "$here\AndroidManifest.xml", "$build\res.zip",
    '--rename-manifest-package', $appId,
    '--min-sdk-version', $minSdk, '--target-sdk-version', $targetSdk, '--version-code', $versionCode, '--version-name', $versionName)

Write-Host '1/6 Ressources'
Run "$bt\aapt2.exe" @('compile', '--dir', "$here\res", '-o', "$build\res.zip")
Run "$bt\aapt2.exe" (@('link', '-o', "$build\base.apk") + $linkArgs)
Run "$bt\aapt2.exe" (@('link', '--proto-format', '-o', "$build\proto.apk") + $linkArgs)

Write-Host '2/6 Java'
$sources = Get-ChildItem "$here\src" -Recurse -Filter *.java | ForEach-Object FullName
Run "$jdkBin\javac.exe" (@('-nowarn', '-source', '11', '-target', '11', '-encoding', 'UTF-8', '-classpath', $jar, '-d', "$build\classes") + $sources)

Write-Host '3/6 Dex'
$classes = Get-ChildItem "$build\classes" -Recurse -Filter *.class | ForEach-Object FullName
Run "$bt\d8.bat" (@('--release', '--min-api', $minSdk, '--lib', $jar, '--output', "$build\dex") + $classes)

Write-Host '4/6 APK'
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
$zip = [IO.Compression.ZipFile]::Open("$build\base.apk", 'Update')
[void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, "$build\dex\classes.dex", 'classes.dex')
$zip.Dispose()
Run "$bt\zipalign.exe" @('-p', '-f', '4', "$build\base.apk", "$build\aligned.apk")
Run "$bt\apksigner.bat" @('sign', '--ks', $ks, '--ks-pass', "pass:$pass", '--key-pass', "pass:$pass", '--out', $apkOut, "$build\aligned.apk")
Run "$bt\apksigner.bat" @('verify', $apkOut)

Write-Host '5/6 App Bundle (Google Play)'
$bundletool = "$here\tools\bundletool-all-$bundletoolVersion.jar"
if (-not (Test-Path $bundletool)) {
    New-Item -ItemType Directory -Force "$here\tools" | Out-Null
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest "https://github.com/google/bundletool/releases/download/$bundletoolVersion/bundletool-all-$bundletoolVersion.jar" -OutFile $bundletool -UseBasicParsing
}
# Module « base » au format attendu par bundletool : manifest/, dex/, res/, resources.pb
$mod = "$build\module"
[IO.Compression.ZipFile]::ExtractToDirectory("$build\proto.apk", $mod)
New-Item -ItemType Directory -Force "$mod\manifest", "$mod\dex" | Out-Null
Move-Item "$mod\AndroidManifest.xml" "$mod\manifest\AndroidManifest.xml"
Copy-Item "$build\dex\classes.dex" "$mod\dex\classes.dex"
# jar (et non ZipFile.CreateFromDirectory, qui écrit des « \ » dans les chemins sous Windows PowerShell)
Run "$jdkBin\jar.exe" @('--create', '--no-manifest', '--file', "$build\base-module.zip", '-C', $mod, '.')
Remove-Item $aabOut -ErrorAction SilentlyContinue
Run "$jdkBin\java.exe" @('-jar', $bundletool, 'build-bundle', "--modules=$build\base-module.zip", "--output=$aabOut")

Write-Host '6/6 Signature du bundle (clé d''envoi)'
Run "$jdkBin\jarsigner.exe" @('-keystore', $ks, '-storepass', $pass, '-keypass', $pass, '-sigalg', 'SHA256withRSA', '-digestalg', 'SHA-256', $aabOut, 'pptremote')
Run "$jdkBin\java.exe" @('-jar', $bundletool, 'validate', "--bundle=$aabOut")

Write-Host "`nAPK prêt    : $apkOut`nBundle prêt : $aabOut"
