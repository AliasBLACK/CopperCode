Option Explicit

Dim objFSO, objShell, scriptFolder, sourceFolder, targetFolder, documentsFolder

' COPY EXTENSIONS FOLDER
' ======================

' Create a Shell object
Set objFSO = CreateObject("Scripting.FileSystemObject")
Set objShell = CreateObject("WScript.Shell")

' Source Folder
scriptFolder = objFSO.GetParentFolderName(WScript.ScriptFullName)
sourceFolder = objFSO.BuildPath(scriptFolder, "ccb_extensions")

' Destination Folder
documentsFolder = objShell.SpecialFolders("MyDocuments")
targetFolder = objFSO.BuildPath(documentsFolder, "CopperCube\extensions")

' Check if the target folder exists, if not create it
If Not objFSO.FolderExists(targetFolder) Then
    objFSO.CreateFolder(targetFolder)
End If

' Copy the contents of the source folder to the target folder
If objFSO.FolderExists(sourceFolder) Then
    objFSO.CopyFolder sourceFolder, targetFolder, True
Else
    WScript.Echo "Source folder does not exist: " & sourceFolder
End If