on run argv
 set deckPath to item 1 of argv
 set AppleScript's text item delimiters to "/"
 set deckName to last text item of deckPath
 set AppleScript's text item delimiters to ""
 tell application "Microsoft PowerPoint"
  open (POSIX file deckPath)
  repeat 30 times
   if exists presentation deckName then exit repeat
   delay 1
  end repeat
  set deck to presentation deckName
  set settings to slide show settings of deck
  set show type of settings to slide show type window
  set show with presenter of settings to false
  set sw to run slide show settings
  set width of sw to 800
  set height of sw to 450
  delay 2
  set playback to get player from (slideshow view of sw) for (shape 1 of slide 1 of deck)
  set positionA to current position of playback
  set stateA to player state of playback
  delay 5
  set positionB to current position of playback
  delay 16
  set positionC to current position of playback
  set stateC to player state of playback
  exit slide show (slideshow view of sw)
  close deck saving no
  return "positionMs=" & positionA & "," & positionB & "," & positionC & " states=" & stateA & "," & stateC
 end tell
end run
