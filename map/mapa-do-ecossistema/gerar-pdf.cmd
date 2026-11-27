@echo off
cd /d "%~dp0"
set CHROME="C:\Program Files\Google\Chrome\Application\chrome.exe"
%CHROME% --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=8000 --print-to-pdf="%~dp0mapa-do-ecossistema.pdf" "file:///%~dp0index.html"
%CHROME% --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=8000 --print-to-pdf="%~dp0mapa-do-ecossistema-light.pdf" "file:///%~dp0index.html?light"
echo PDFs gerados: mapa-do-ecossistema.pdf (dark) e mapa-do-ecossistema-light.pdf (light)
