@echo off
echo Installing PyInstaller...
..\.venv\Scripts\python.exe -m pip install pyinstaller
echo Building Python backend with PyInstaller...
..\.venv\Scripts\pyinstaller --noconfirm --onefile --windowed --name backend --distpath ..\dist_backend --workpath ..\build_backend ^
  --hidden-import=uvicorn.logging ^
  --hidden-import=uvicorn.loops ^
  --hidden-import=uvicorn.loops.auto ^
  --hidden-import=uvicorn.protocols ^
  --hidden-import=uvicorn.protocols.http ^
  --hidden-import=uvicorn.protocols.http.auto ^
  --hidden-import=uvicorn.protocols.websockets ^
  --hidden-import=uvicorn.protocols.websockets.auto ^
  --hidden-import=uvicorn.lifespan ^
  --hidden-import=uvicorn.lifespan.on ^
  --hidden-import=uvicorn.lifespan.off ^
  run_backend.py
echo Backend build complete.

if not exist ..\cert.pfx (
    echo Generating Self-Signed Certificate...
    powershell -Command "$cert = New-SelfSignedCertificate -Type Custom -Subject 'CN=VahanDashboard' -KeyUsage DigitalSignature -FriendlyName 'VahanDashboard' -CertStoreLocation 'Cert:\CurrentUser\My' -TextExtension @('2.5.29.37={text}1.3.6.1.5.5.7.3.3', '2.5.29.19={text}'); $pwd = ConvertTo-SecureString -String 'password' -Force -AsPlainText; Export-PfxCertificate -Cert $cert -FilePath '..\cert.pfx' -Password $pwd"
)

