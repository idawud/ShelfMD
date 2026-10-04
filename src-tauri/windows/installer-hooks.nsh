!macro NSIS_HOOK_POSTINSTALL
  CreateShortCut "$DESKTOP\ShelfMD.lnk" "$INSTDIR\shelfmd.exe" "" "$INSTDIR\shelfmd.exe" 0
  CreateShortCut "$SMPROGRAMS\ShelfMD.lnk" "$INSTDIR\shelfmd.exe" "" "$INSTDIR\shelfmd.exe" 0
!macroend
