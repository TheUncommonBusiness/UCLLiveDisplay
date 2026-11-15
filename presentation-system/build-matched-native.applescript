on run argv
 set deckPath to item 1 of argv
 set pdfPath to item 2 of argv
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
  set resultText to "slides=" & (count of slides of deck) & linefeed
  repeat with slideIndex from 1 to (count of slides of deck)
   repeat with shapeIndex from 1 to (count of shapes of slide slideIndex of deck)
    if shape type of shape shapeIndex of slide slideIndex of deck is shape type media then
     set playback to animation play settings of animation settings of shape shapeIndex of slide slideIndex of deck
     set resultText to resultText & "slide=" & slideIndex & " autoplay=" & (play on entry of playback) & " loop=" & (loop until stopped of playback) & linefeed
    end if
   end repeat
  end repeat
  set resultText to resultText & "showLoop=" & (loop until stopped of slide show settings of deck) & linefeed
  if (count of argv) > 2 then
   repeat with slideIndex from 1 to (count of slides of deck)
    set hidden of slide show transition of slide slideIndex of deck to false
   end repeat
  end if
  set print hidden slides of print options of deck to true
  save deck in (POSIX file pdfPath) as save as PDF
  close deck saving no
  return resultText
 end tell
end run
