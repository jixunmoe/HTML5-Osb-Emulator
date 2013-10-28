# HTML5 Osb Emulator
[![Creative Commons License](http://i.creativecommons.org/l/by-sa/3.0/80x15.png)](http://creativecommons.org/licenses/by-sa/3.0/)
HTML5 Osb Emulator is released under [Creative Commons Attribution-ShareAlike 3.0 Unported License](http://creativecommons.org/licenses/by-sa/3.0/).

## FAQ
###How to use the code?
Firstly, you'll need to include the `playOsu!.js` in to your project, then:
```javascript
var $c = playOsu({
	basePath: 'mapset/MapId/', 				// Specify the map base path.
	osuPath: 'Artist - SongName (Mapper) [Diff].osu', 	// Specify the osu file for render.
	osbPath: 'Artist - SongName (Mapper).osb', 		// Specify the osb file for render.
	musicPath: 'The_File_Name_of_the_Music.mp3'		// The Audio file name.
}, 'osuStage');
```

### Change resolution at run time?
Sure. Firstly, include the following (Or similar) HTML code...
```html
<select id="reso">
	<option value="0.5">320x240</option>
	<option value="1" selected="selected">640x480</option>
	<option value="1.25">800x600</option>
	<option value="1.88125">1024x768</option>
</select>
```
... with the following JavaScript code ...
```javascript
$('#reso').on ('change', function(){
	var b = { w: 640, h: 480 }, zoom = parseFloat(this.value);
	$c.stage.setScale  (zoom);	 // Set the zoom
	$c.stage.setWidth  (zoom * b.w); // Set the new
	$c.stage.setHeight (zoom * b.h); //   Height & Width
});
```

Note:
If the audio from the osz file does not work, try:
`ffmpeg -i "Path/To/Audio" "Output/Path/Filename.mp3"`
