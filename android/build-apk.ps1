# Compile l'APK sans Gradle, avec les outils du SDK Android.
# Usage : powershell -ExecutionPolicy Bypass -File android\build-apk.ps1
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
$sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { "$env:LOCALAPPDATA\Android\Sdk" }
$bt = Get-ChildItem "$sdk\build-tools" | Where-Object Name -notmatch 'rc' | Sort-Object { [version]$_.Name } | Select-Object -Last 1 -ExpandProperty FullName
$platform = Get-ChildItem "$sdk\platforms" | Sort-Object { [int]($_.Name -replace '\D', '') } | Select-Object -Last 1 -ExpandProperty FullName
$jar = "$platform\android.jar"
$build = "$here\build"
$out = Join-Path (Split-Path $here) 'Telecommande-PPT.apk'

function Run([string]$exe, [string[]]$a) { & $exe $a; if ($LASTEXITCODE -ne 0) { throw "Échec : $exe" } }

Write-Host "build-tools : $bt`nplateforme  : $platform"
Remove-Item $build -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force "$build\classes", "$build\dex" | Out-Null

Write-Host '1/5 Ressources'
Run "$bt\aapt2.exe" @('compile', '--dir', "$here\res", '-o', "$build\res.zip")
Run "$bt\aapt2.exe" @('link', '-I', $jar, '--manifest', "$here\AndroidManifest.xml", '-o', "$build\base.apk", "$build\res.zip",
    '--min-sdk-version', '28', '--target-sdk-version', '34', '--version-code', '4', '--version-name', '1.3')

Write-Host '2/5 Java'
$sources = Get-ChildItem "$here\src" -Recurse -Filter *.java | ForEach-Object FullName
Run javac (@('-nowarn', '-source', '11', '-target', '11', '-encoding', 'UTF-8', '-classpath', $jar, '-d', "$build\classes") + $sources)

Write-Host '3/5 Dex'
$classes = Get-ChildItem "$build\classes" -Recurse -Filter *.class | ForEach-Object FullName
Run "$bt\d8.bat" (@('--release', '--min-api', '28', '--lib', $jar, '--output', "$build\dex") + $classes)

Write-Host '4/5 Assemblage'
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
$zip = [IO.Compression.ZipFile]::Open("$build\base.apk", 'Update')
[void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, "$build\dex\classes.dex", 'classes.dex')
$zip.Dispose()
Run "$bt\zipalign.exe" @('-p', '-f', '4', "$build\base.apk", "$build\aligned.apk")

Write-Host '5/5 Signature'
$ks = "$here\ppt-remote.keystore"
$keytool = (Get-Command keytool -ErrorAction SilentlyContinue).Source
if (-not $keytool) {
    $keytool = Get-ChildItem 'C:\Program Files\Java', 'C:\Program Files\Eclipse Adoptium', 'C:\Program Files\Android\Android Studio\jbr' `
        -Recurse -Filter keytool.exe -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
}
if (-not (Test-Path $ks)) {
    Run $keytool @('-genkeypair', '-keystore', $ks, '-alias', 'pptremote', '-keyalg', 'RSA', '-keysize', '2048', '-validity', '10000',
        '-storepass', 'pptremote', '-keypass', 'pptremote', '-dname', 'CN=PPT Remote')
}
Run "$bt\apksigner.bat" @('sign', '--ks', $ks, '--ks-pass', 'pass:pptremote', '--key-pass', 'pass:pptremote', '--out', $out, "$build\aligned.apk")
Run "$bt\apksigner.bat" @('verify', $out)
Write-Host "`nAPK prêt : $out"
