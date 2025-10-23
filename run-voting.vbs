Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Lấy đường dẫn thư mục hiện tại
strCurrentPath = objFSO.GetParentFolderName(WScript.ScriptFullName)

' Tìm Chrome
strChromePath = ""
arrChromePaths = Array( _
    objShell.ExpandEnvironmentStrings("%ProgramFiles%") & "\Google\Chrome\Application\chrome.exe", _
    objShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\Google\Chrome\Application\chrome.exe", _
    objShell.ExpandEnvironmentStrings("%LocalAppData%") & "\Google\Chrome\Application\chrome.exe" _
)

For Each path In arrChromePaths
    If objFSO.FileExists(path) Then
        strChromePath = path
        Exit For
    End If
Next

' Nếu không có Chrome, tìm Edge
If strChromePath = "" Then
    arrEdgePaths = Array( _
        objShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\Microsoft\Edge\Application\msedge.exe", _
        objShell.ExpandEnvironmentStrings("%ProgramFiles%") & "\Microsoft\Edge\Application\msedge.exe" _
    )
    
    For Each path In arrEdgePaths
        If objFSO.FileExists(path) Then
            strChromePath = path
            Exit For
        End If
    Next
End If

' Kiem tra co tim thay trinh duyet khong
If strChromePath = "" Then
    MsgBox "Khong tim thay Google Chrome hoac Microsoft Edge!" & vbCrLf & vbCrLf & _
           "Vui long cai dat mot trong hai trinh duyet nay.", vbCritical, "Loi"
    WScript.Quit
End If

' Hien thi thong bao huong dan
intResult = MsgBox("EUREKA POSTER AUTO VOTING" & vbCrLf & vbCrLf & _
                   "Huong dan su dung:" & vbCrLf & _
                   "1. Dam bao da dang nhap tai khoan Google" & vbCrLf & _
                   "2. Extension se tu dong mo" & vbCrLf & _
                   "3. Chon ma poster va nhan 'Bat dau binh chon'" & vbCrLf & vbCrLf & _
                   "Nhan OK de tiep tuc...", vbInformation + vbOKCancel, "Eureka Voting")

If intResult = vbCancel Then
    WScript.Quit
End If

' URL trang web cua ban (thay bang URL that sau khi upload)
strWebURL = "https://cm-bdu-edu.github.io/Eureka-Auto-Voting/"
' HOAC neu host local: "http://localhost:8000/start.html"

' Mo Chrome voi extension va trang web
strCommand = """" & strChromePath & """ --load-extension=""" & strCurrentPath & """ """ & strWebURL & """"
objShell.Run strCommand, 1, False

' Cho 3 giay de Chrome khoi dong
WScript.Sleep 3000

' Kiem tra va huong dan
MsgBox "Kiem tra xem extension da load chua:" & vbCrLf & vbCrLf & _
       "1. Nhin goc TREN PHAI cua Chrome" & vbCrLf & _
       "2. Co thay icon 'puzzle' (Extensions) khong?" & vbCrLf & _
       "3. Neu KHONG thay, lam theo:" & vbCrLf & vbCrLf & _
       "   - Nhan Ctrl+Shift+E" & vbCrLf & _
       "   - Hoac vao chrome://extensions" & vbCrLf & _
       "   - Bat 'Developer mode'" & vbCrLf & _
       "   - Nhan 'Load unpacked'" & vbCrLf & _
       "   - Chon thu muc: " & strCurrentPath & vbCrLf & vbCrLf & _
       "4. Sau khi load xong, RELOAD trang web", vbInformation, "Huong dan"
