; Règle de pare-feu : autorise les téléphones du réseau local à joindre la télécommande,
; sans la fenêtre d'alerte de Windows au premier lancement.

!macro customInstall
  nsExec::Exec 'netsh advfirewall firewall delete rule name="Télécommande PPT"'
  nsExec::Exec 'netsh advfirewall firewall add rule name="Télécommande PPT" dir=in action=allow program="$INSTDIR\${APP_EXECUTABLE_FILENAME}" enable=yes profile=private,domain'
!macroend

!macro customUnInstall
  nsExec::Exec 'netsh advfirewall firewall delete rule name="Télécommande PPT"'
!macroend
