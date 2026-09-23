Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "c:\Users\fajar\router-block"
WshShell.Run "cmd /c npm run dev", 0, False
