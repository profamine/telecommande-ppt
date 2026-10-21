# Pont entre le serveur Node et PowerPoint (automation COM).
# Lit une commande JSON par ligne sur stdin, répond une ligne JSON sur stdout.
# Format : {"id":1,"cmd":"next","arg":null}  ->  {"id":1,"ok":true,"data":{...}}

$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = [Text.Encoding]::UTF8
[Console]::OutputEncoding = [Text.Encoding]::UTF8

Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class Win32 {
    [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
}
'@

# Zone de la diapositive à l'écran (pixels), calculée à l'activation du laser
$script:laserRect = $null

$thumbDir = Join-Path $env:TEMP 'ppt-remote-thumbs'
New-Item -ItemType Directory -Force -Path $thumbDir | Out-Null

$script:isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)
$script:app = $null
# Raison pour laquelle PowerPoint est ouvert mais inaccessible (affichée sur la télécommande)
$script:appProblem = $null

function Test-AppAlive($a) {
    try { $null = $a.Version; return $true } catch { return $false }
}

function Get-App {
    $script:appProblem = $null
    if ($script:app -and (Test-AppAlive $script:app)) { return $script:app }
    $script:app = $null
    try { $script:app = [Runtime.InteropServices.Marshal]::GetActiveObject('PowerPoint.Application'); return $script:app } catch {}

    # GetActiveObject échoue quand PowerPoint, ouvert normalement, n'a pas encore perdu le focus :
    # Office ne s'inscrit auprès de Windows qu'à ce moment-là. PowerPoint n'acceptant qu'une seule
    # instance, New-Object se rattache alors à celle qui tourne déjà (on ne le fait que si elle existe,
    # pour ne jamais lancer PowerPoint soi-même).
    if (-not (Get-Process POWERPNT -ErrorAction SilentlyContinue)) { return $null }
    if ($script:isAdmin) {
        # Un processus administrateur ne voit pas le PowerPoint de l'utilisateur et en créerait un autre
        $script:appProblem = 'admin'
        return $null
    }
    try {
        $a = New-Object -ComObject PowerPoint.Application
        # Instance neuve et invisible : celle de l'utilisateur tourne avec d'autres droits
        # (PowerPoint lancé « en tant qu'administrateur ») ; on referme celle qu'on vient de créer.
        if (-not $a.Visible -and $a.Presentations.Count -eq 0) {
            try { $a.Quit() } catch {}
            $script:appProblem = 'pptAdmin'
            return $null
        }
        $script:app = $a
        return $a
    } catch {
        $script:appProblem = 'inaccessible'
        return $null
    }
}

function Get-Presentation($app) {
    if (-not $app) { return $null }
    try { if ($app.Presentations.Count -eq 0) { return $null } } catch { return $null }
    # Priorité au diaporama en cours, sinon présentation active
    try { if ($app.SlideShowWindows.Count -gt 0) { return $app.SlideShowWindows.Item(1).Presentation } } catch {}
    try { return $app.ActivePresentation } catch { return $null }
}

function Get-ShowView($app) {
    try { if ($app.SlideShowWindows.Count -gt 0) { return $app.SlideShowWindows.Item(1).View } } catch {}
    return $null
}

function Get-Notes($slide) {
    try {
        foreach ($shape in $slide.NotesPage.Shapes) {
            if ($shape.Type -eq 14 -and $shape.PlaceholderFormat.Type -eq 2) { # ppPlaceholderBody
                if ($shape.HasTextFrame) { return [string]$shape.TextFrame.TextRange.Text }
            }
        }
    } catch {}
    return ''
}

function Get-Title($slide) {
    try {
        foreach ($shape in $slide.Shapes) {
            if ($shape.Type -eq 14) {
                $t = $shape.PlaceholderFormat.Type
                if (($t -eq 1 -or $t -eq 3) -and $shape.HasTextFrame) { # titre / titre centré
                    return [string]$shape.TextFrame.TextRange.Text
                }
            }
        }
    } catch {}
    return ''
}

function Get-Status {
    $app = Get-App
    $pres = Get-Presentation $app
    if (-not $pres) {
        return @{ powerpoint = [bool]$app; presentation = $null; problem = $script:appProblem }
    }
    $total = $pres.Slides.Count
    $view = Get-ShowView $app
    $index = 0
    $state = 'edit'
    $ended = $false
    if ($view) {
        $state = switch ($view.State) { 1 { 'running' } 2 { 'paused' } 3 { 'black' } 4 { 'white' } 5 { 'done' } default { 'running' } }
        try { $index = [int]$view.Slide.SlideIndex } catch { $index = 0 }
        if ($state -eq 'done' -or $index -lt 1) { $ended = $true; $index = $total }
    } else {
        try { $index = $app.ActiveWindow.View.Slide.SlideIndex } catch { $index = 1 }
    }
    $notes = ''; $title = ''; $nextTitle = ''
    if ($index -ge 1 -and $index -le $total) {
        $slide = $pres.Slides.Item($index)
        $notes = Get-Notes $slide
        $title = Get-Title $slide
        if ($index -lt $total) { $nextTitle = Get-Title $pres.Slides.Item($index + 1) }
    }
    return @{
        powerpoint   = $true
        presentation = [string]$pres.Name
        path         = [string]$pres.FullName
        inShow       = [bool]$view
        state        = $state
        ended        = $ended
        slide        = $index
        total        = $total
        title        = $title
        nextTitle    = $nextTitle
        notes        = $notes
    }
}

function Move-Laser($arg) {
    $r = $script:laserRect
    if (-not $r -or $null -eq $arg) { return }
    # Littéraux 0.0 / 1.0 : avec 0 et 1, PowerShell choisirait Max(int, int) et arrondirait
    $x = [Math]::Min(1.0, [Math]::Max(0.0, [double]$arg.x))
    $y = [Math]::Min(1.0, [Math]::Max(0.0, [double]$arg.y))
    $px = [int]($r.x + $x * $r.w); $py = [int]($r.y + $y * $r.h)
    [void][Win32]::SetCursorPos($px, $py)
    return @{ x = $px; y = $py }
}

function Invoke-Command2($cmd, $arg) {
    # Déplacement du laser : chemin rapide, sans appel COM
    if ($cmd -eq 'laser') { return @{ laser = $true; cursor = (Move-Laser $arg) } }

    $app = Get-App
    if (-not $app -and $cmd -ne 'status') {
        switch ($script:appProblem) {
            'admin'    { throw 'Relancez Télécommande PPT normalement (pas « en tant qu''administrateur »)' }
            'pptAdmin' { throw 'PowerPoint est lancé en administrateur : relancez-le normalement' }
            'inaccessible' { throw 'PowerPoint est ouvert mais ne répond pas : cliquez une fois en dehors de PowerPoint puis réessayez' }
            default    { throw 'PowerPoint n''est pas ouvert' }
        }
    }
    $pres = Get-Presentation $app
    $view = if ($app) { Get-ShowView $app } else { $null }

    switch ($cmd) {
        'status' { }
        'next' {
            if ($view) { $view.Next() }
            elseif ($pres) { $i = $app.ActiveWindow.View.Slide.SlideIndex; if ($i -lt $pres.Slides.Count) { $app.ActiveWindow.View.GotoSlide($i + 1) } }
        }
        'prev' {
            if ($view) { $view.Previous() }
            elseif ($pres) { $i = $app.ActiveWindow.View.Slide.SlideIndex; if ($i -gt 1) { $app.ActiveWindow.View.GotoSlide($i - 1) } }
        }
        'goto' {
            $n = [int]$arg
            if ($view) { $view.GotoSlide($n) }
            elseif ($pres) { $app.ActiveWindow.View.GotoSlide($n) }
        }
        'start' {
            if (-not $pres) { throw 'Aucune présentation ouverte' }
            if (-not $view) {
                $from = 1
                if ($arg -eq 'current') { try { $from = $app.ActiveWindow.View.Slide.SlideIndex } catch {} }
                $settings = $pres.SlideShowSettings
                $settings.RangeType = 1   # ppShowAll
                $null = $settings.Run()
                if ($from -gt 1) { (Get-ShowView $app).GotoSlide($from) }
            }
        }
        'end' { if ($view) { $view.Exit() } }
        'black' { if ($view) { $view.State = if ($view.State -eq 3) { 1 } else { 3 } } }
        'white' { if ($view) { $view.State = if ($view.State -eq 4) { 1 } else { 4 } } }
        'laserOn' {
            if (-not $view) { throw 'Lancez d''abord le diaporama' }
            # Fenêtre du diaporama en points -> pixels logiques (96 ppp), l'espace de SetCursorPos
            # pour ce processus non « DPI aware »
            $win = $app.SlideShowWindows.Item(1)
            $k = 96 / 72
            $wx = $win.Left * $k; $wy = $win.Top * $k; $ww = $win.Width * $k; $wh = $win.Height * $k
            if ($ww -le 0 -or $wh -le 0) { throw 'Fenêtre du diaporama introuvable' }
            # La diapositive est centrée dans la fenêtre avec des bandes noires si les proportions diffèrent
            $ratio = $pres.PageSetup.SlideWidth / $pres.PageSetup.SlideHeight
            if ($ww / $wh -gt $ratio) { $h = $wh; $w = $wh * $ratio } else { $w = $ww; $h = $ww / $ratio }
            $script:laserRect = @{ x = $wx + ($ww - $w) / 2; y = $wy + ($wh - $h) / 2; w = $w; h = $h }
            if ($view.State -ne 1) { $view.State = 1 }
            try { if (-not $win.Active) { $win.Activate() } } catch {}
            $null = Move-Laser $arg
            try { $view.LaserPointerEnabled = $true } catch { $view.PointerType = 1 }
            $null = Move-Laser $arg
            return @{ laser = $true }
        }
        'laserOff' {
            if ($view) {
                try { $view.LaserPointerEnabled = $false } catch {}
                $view.PointerType = 4   # ppSlideShowPointerAutoArrow : se masque tout seul
            }
            $script:laserRect = $null
            return @{ laser = $false }
        }
        'thumb' {
            if (-not $pres) { throw 'Aucune présentation ouverte' }
            $n = [int]$arg
            if ($n -lt 1 -or $n -gt $pres.Slides.Count) { throw 'Diapositive inexistante' }
            $file = Join-Path $thumbDir ("{0}_{1}.png" -f ([Math]::Abs($pres.FullName.GetHashCode())), $n)
            $pres.Slides.Item($n).Export($file, 'PNG', 960, 540)
            return @{ file = $file }
        }
        default { throw "Commande inconnue : $cmd" }
    }
    return Get-Status
}

while ($true) {
    $line = [Console]::In.ReadLine()
    if ($null -eq $line) { break }
    if ($line.Trim() -eq '') { continue }
    $id = $null
    try {
        $req = $line | ConvertFrom-Json
        $id = $req.id
        $data = Invoke-Command2 $req.cmd $req.arg
        $out = @{ id = $id; ok = $true; data = $data }
    } catch {
        $out = @{ id = $id; ok = $false; error = $_.Exception.Message }
    }
    [Console]::Out.WriteLine(($out | ConvertTo-Json -Compress -Depth 5))
    [Console]::Out.Flush()
}
