# Minimaler statischer Webserver für die lokale Vorschau (nur localhost).
param([int]$Port = 8765)
$root = Split-Path -Parent $PSScriptRoot
$types = @{ '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.json'='application/json; charset=utf-8'; '.svg'='image/svg+xml'; '.png'='image/png' }
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/")
$l.Start()
Write-Host "Server läuft auf http://localhost:$Port/"
while ($l.IsListening) {
  $ctx = $l.GetContext()
  $pfad = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
  if ($pfad -eq '') { $pfad = 'index.html' }
  $datei = Join-Path $root $pfad
  $voll = [IO.Path]::GetFullPath($datei)
  if ($voll.StartsWith($root) -and (Test-Path $voll -PathType Leaf) -and ($voll -notmatch '\\material\\')) {
    $bytes = [IO.File]::ReadAllBytes($voll)
    $ext = [IO.Path]::GetExtension($voll).ToLower()
    $ctx.Response.ContentType = if ($types[$ext]) { $types[$ext] } else { 'application/octet-stream' }
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else { $ctx.Response.StatusCode = 404 }
  $ctx.Response.Close()
}
