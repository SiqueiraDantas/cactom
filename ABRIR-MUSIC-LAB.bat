@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title Made In Sertao Music Lab - 0.8.1

echo ===============================================
echo MADE IN SERTAO MUSIC LAB - MVP 0.8.1
echo ===============================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo ERRO: Node.js nao encontrado. Instale Node.js 22 ou superior em https://nodejs.org
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo ERRO: npm nao encontrado. Reinstale Node.js.
  pause
  exit /b 1
)
if not exist "node_modules\opensheetmusicdisplay\package.json" (
  echo Primeira execucao: instalando dependencias. Requer internet.
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo ERRO: nao foi possivel instalar as dependencias.
    pause
    exit /b 1
  )
)
echo.
echo Abrindo o novo visual em http://127.0.0.1:5174
call npm run dev -- --port 5174 --strictPort --open
if errorlevel 1 echo Falha ao iniciar. Consulte o terminal.
pause
