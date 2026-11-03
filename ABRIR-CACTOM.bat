@echo off
setlocal
cd /d "%~dp0"
title CACTOM - abrir no computador
echo.
echo ====================================
echo      CACTOM - A MUSICA FLORESCE
echo ====================================
echo.
where node >nul 2>nul
if errorlevel 1 goto faltanode
where npm.cmd >nul 2>nul
if errorlevel 1 goto faltanpm
echo Node encontrado:
node --version
echo npm encontrado:
call npm.cmd --version
echo.
if not exist "node_modules\vite\bin\vite.js" goto instalar
goto iniciar
:instalar
echo Primeira abertura: instalando dependencias (requer internet)...
call npm.cmd ci --no-audit --no-fund
if errorlevel 1 goto falhainstall
:iniciar
echo.
echo Abrindo o CACTOM...
echo O endereco sera http://127.0.0.1:5174/
echo Se a porta mudar, use a URL mostrada abaixo.
echo.
call npm.cmd run dev -- --port 5174 --open
if errorlevel 1 goto falhainiciar
goto fim
:faltanode
echo ERRO: Node.js nao encontrado. Instale Node.js LTS pelo site nodejs.org
goto fim
:faltanpm
echo ERRO: npm nao encontrado. Reinstale Node.js LTS.
goto fim
:falhainstall
echo.
echo ERRO na instalacao. Copie ou fotografe o texto acima e envie no chat.
goto fim
:falhainiciar
echo.
echo ERRO ao abrir o app. Copie ou fotografe o texto acima.
:fim
echo.
pause
