; Force install directory to C:\Program Files\registration.front
; to match the Inno Setup first-install path, so OTA updates overwrite the same files.
; NB: $PROGRAMFILES always resolves to x86; use $PROGRAMFILES64 for the 64-bit path.
!macro preInit
  SetRegView 64
  WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "$PROGRAMFILES64\registration.front"
  WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "$PROGRAMFILES64\registration.front"
!macroend
