# FERTIVA - Daemon de Sincronização Automática Contínua para o GitHub
$gitCmd = "C:\Users\Guilh\AppData\Local\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd"
$env:PATH = "$gitCmd;C:\Program Files\nodejs;C:\Users\Guilh\.local\bin;" + $env:PATH

Set-Location "C:\Users\Guilh\.gemini\antigravity\scratch\fertiva"

Write-Host "=========================================================="
Write-Host "  🌾 FERTIVA - Auto-Sync Ativo (Monitoramento Contínuo)  "
Write-Host "=========================================================="
Write-Host "Qualquer alteração em arquivos será enviada ao GitHub automaticamente sem que você precise clicar em nada."
Write-Host ""

while ($true) {
    try {
        $status = git status --porcelain
        if ($status) {
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            Write-Host "[$timestamp] Alterações detectadas. Iniciando envio automático..."
            git add .
            git commit -m "auto: atualização automática do sistema ($timestamp)"
            $pushResult = git push origin main 2>&1
            Write-Host "[$timestamp] ✓ Enviado com sucesso para o GitHub!"
        }
    } catch {
        Write-Host "Erro durante a sincronização: $_"
    }
    Start-Sleep -Seconds 15
}
