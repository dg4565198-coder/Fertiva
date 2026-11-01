@echo off
chcp 65001 >nul
echo ========================================================
echo   🌾 FERTIVA - Sincronização Automática com o GitHub
echo ========================================================
echo.

set PATH=C:\Users\Guilh\AppData\Local\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd;C:\Program Files\nodejs;%PATH%

echo [1/3] Verificando arquivos alterados...
git status -s

echo.
echo [2/3] Adicionando e registrando atualizações...
git add .
set DATA_HORA=%date% %time%
git commit -m "update: melhorias e aprimoramentos no Fertiva (%DATA_HORA%)"

echo.
echo [3/3] Enviando para o GitHub (https://github.com/dg4565198-coder/Fertiva.git)...
git push origin main

echo.
echo ========================================================
echo   ✓ Atualizações enviadas com sucesso para o GitHub!
echo   O GitHub Actions iniciará a publicação em instantes.
echo ========================================================
pause
