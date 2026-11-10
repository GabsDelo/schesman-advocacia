@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Schesman Advocacia - Servidor local

set "PYTHON="
py -3 --version >nul 2>nul
if not errorlevel 1 set "PYTHON=py -3"
if not defined PYTHON (
  python --version >nul 2>nul
  if not errorlevel 1 set "PYTHON=python"
)
if not defined PYTHON goto :no_python

set "PORT=8080"
:check_port
netstat -ano | findstr /R /C:":%PORT% .*LISTENING" >nul
if errorlevel 1 goto :start
set /a PORT+=1
if %PORT% GTR 8090 goto :no_port
goto :check_port

:start
set "URL=http://localhost:%PORT%"
echo.
echo ============================================================
echo   Schesman Advocacia - site local
echo ============================================================
echo.
echo   Site:   %URL%
echo   Painel: %URL%/admin.html
echo   Senha:  admin123
echo.
echo   Para encerrar, feche esta janela ou pressione Ctrl+C.
echo.
if /I not "%SITE_NO_BROWSER%"=="1" start "" /b powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process '%URL%'"
%PYTHON% -m http.server %PORT%
echo.
echo Servidor encerrado.
pause
goto :end

:no_python
echo.
echo Python nao encontrado neste computador.
echo.
echo O site precisa do Python apenas para o servidor local.
echo Instale em https://www.python.org/downloads/ e marque
echo a opcao "Add Python to PATH" durante a instalacao.
echo.
echo Vou tentar abrir o site diretamente agora. O painel pode
echo nao compartilhar os dados nesse modo.
echo.
start "" "index.html"
pause
goto :end

:no_port
echo.
echo Nenhuma porta livre encontrada entre 8080 e 8090.
echo Feche outros servidores e tente novamente.
echo.
pause

:end
endlocal
