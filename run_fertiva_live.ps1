$env:PATH = "C:\Program Files\nodejs;C:\Users\Guilh\.local\bin;" + $env:PATH
$git = "C:\Users\Guilh\AppData\Local\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd\git.exe"

Write-Host "Iniciando Servidor FERTIVA Preview na porta 5173..." -ForegroundColor Green
$previewProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm.cmd run preview -- --port 5173 --host" -WorkingDirectory "C:\Users\Guilh\.gemini\antigravity\scratch\fertiva\frontend" -PassThru -NoNewWindow

Start-Sleep -Seconds 3

Write-Host "Iniciando Cloudflare Tunnel..." -ForegroundColor Cyan
& "C:\Users\Guilh\.local\bin\cloudflared.exe" tunnel --url http://localhost:5173
