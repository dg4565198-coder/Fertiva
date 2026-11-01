$gitCmd = "C:\Users\Guilh\AppData\Local\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd"
$env:PATH = "$gitCmd;C:\Program Files\nodejs;C:\Users\Guilh\.local\bin;" + $env:PATH

Set-Location "C:\Users\Guilh\.gemini\antigravity\scratch\fertiva"

Write-Host "=========================================================="
Write-Host "  FERTIVA - Auto-Sync Ativo (Monitoramento Continuo)     "
Write-Host "=========================================================="

while ($true) {
    try {
        $status = git status --porcelain
        if ($status) {
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            Write-Host "[$timestamp] Alteracoes detectadas. Enviando para o GitHub..."
            git add .
            git commit -m "auto: atualizacao automatica do sistema ($timestamp)"
            $pushOutput = git push origin main 2>&1
            Write-Host "[$timestamp] Sucesso: atualizacoes enviadas para o GitHub!"
        }
    } catch {
        Write-Host "Erro durante a sincronizacao: $($_.Exception.Message)"
    }
    Start-Sleep -Seconds 15
}
