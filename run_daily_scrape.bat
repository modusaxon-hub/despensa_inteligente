@echo off
rem Script para ejecutar el scraper diario (8:00 AM)
echo Iniciando Scraper Despensa Inteligente...
cd /d "d:\Documentos\Proyectos ADSO\despensa_inteligente\scrapers"
set PLAYWRIGHT_BROWSERS_PATH=d:\Documentos\Proyectos ADSO\despensa_inteligente\scrapers\browsers_final
set PYTHONIOENCODING=utf-8
"C:\Program Files\Python312\python.exe" auto_bot.py
echo Scraper Terminado.
pause
