; // osb Emu
function playOsu ($osuConfig, containerId) {
	// http://notes.jetienne.com/2011/05/18/cancelRequestAnimFrame-for-paul-irish-requestAnimFrame.html
	
	var requestAnimFrame = (function(){
		return window.requestAnimationFrame    || 
			window.webkitRequestAnimationFrame || 
			window.mozRequestAnimationFrame    || 
			window.oRequestAnimationFrame      || 
			window.msRequestAnimationFrame     || 
			function(/* function */ callback, /* DOMElement */ element){
				// Fallback method, 120 fps.
				return window.setTimeout(callback, 1000 / 120);
			};
	})(), 
	cancelRequestAnimFrame = 
			window.cancelAnimationFrame              ||
			window.webkitCancelRequestAnimationFrame ||
			window.mozCancelRequestAnimationFrame    ||
			window.oCancelRequestAnimationFrame      ||
			window.msCancelRequestAnimationFrame     ||
			clearTimeout
	;
	
	var emptyFunc = function () {};
	var container = typeof containerId == 'string' ? $(document.getElementById (containerId)) : containerId;
    var stage = new Kinetic.Stage({
        container: containerId,
        width: 640,
        height: 480
        /* http://osu.ppy.sh/wiki/Storyboarding
         * A Storyboard (SB) is a custom-made 640x480 animated background ...
         * */
    });
	if (!stage) {
		console.error ('Unable to create stage.');
		return ;
	}
	
	function createAudio (audioPath) {
		// var myAudio = document.createElement ('audio');
		var myAudio = new Audio($osuConfig.basePath + audioPath);
		$(document.body).append (myAudio);
		// myAudio.src = $osuConfig.basePath + audioPath;
		myAudio.preload = '';
		myAudio.controls = true;
		$(myAudio).css ({		
			bottom: 0,
			position: 'fixed',
			left: 0
		});
		return myAudio;
	}
	
    var $this = {
		stage: stage,
        loadingMsg: {
			anim: 0,
            layer: new Kinetic.Layer(),
            circle: new Kinetic.Circle({
                x: stage.getWidth() / 4,
                y: stage.getHeight() / 2,
                radius: 20,
                fill: 'pink',
                opacity:.7
            }),
            circleRotate: new Kinetic.Circle({
                x: stage.getWidth() / 4,
                y: stage.getHeight() / 2,
                radius: 23,
                // fill: 'pink',
				fillLinearGradientStartPoint: [0, 0],
				fillLinearGradientEndPoint: [60, 0],
				fillLinearGradientColorStops: [0, 'pink', 1, 'red'],
                opacity:.9
            }),
            text: new Kinetic.Text({
                text: 'Loading...',
                x: stage.getWidth() / 4  + 30,
                y: stage.getHeight() / 2,
                fill: 'black'
            })
        },
        timeLayer: {
            layer: new Kinetic.Layer(),
            labelTime1: new Kinetic.Text({
                text: 'Time:',
                x: 10,
                y: 5,
                fill: 'black',
				shadowColor: 'white',
				shadowBlur: 3,
				shadowOffset: .5,
				shadowOpacity: .7
            }),
            labelTime2: new Kinetic.Text({
                text: '-',
                x: 50,
                y: 5,
				fill: '#555',
				shadowColor: 'white',
				shadowBlur: 3,
				shadowOffset: .5,
				shadowOpacity: .7
            })
        },
        osuData:0,
        osbData:0,
        osbLayersK: [new Kinetic.Layer(), new Kinetic.Layer(), new Kinetic.Layer(), new Kinetic.Layer()],
        osbLayers:  [[],[],[],[]]
        /*
        * Storyboard (Background), Storyboard L2 (Fail), Storyboard L2 (Pass), Storyboard Layer 3 (Foreground)
         * */,
		mainAudio: createAudio ($osuConfig.musicPath),
		upd: 0,
		time: 0,
		iC: 0,
		iF: 0,
		fInit: []
    };
	function regInit (fCallback) {
		$this.fInit.push (fCallback);
	}
	// window.$t = $this;
    $this.loadingMsg.layer.add ($this.loadingMsg.circleRotate);
    $this.loadingMsg.layer.add ($this.loadingMsg.circle);
    $this.loadingMsg.layer.add ($this.loadingMsg.text);
    stage.add ($this.loadingMsg.layer);
	
	$this.loadingMsg.anim = new Kinetic.Animation (function(frame) {
		$this.loadingMsg.circleRotate.rotate(frame.timeDiff * Math.PI / 1000);
	}, $this.loadingMsg.layer);
	$this.loadingMsg.anim.start();
	
	// Time layer
	$this.timeLayer.layer.hide();
    $this.timeLayer.layer.add ($this.timeLayer.labelTime1);
    $this.timeLayer.layer.add ($this.timeLayer.labelTime2);
    stage.add ($this.timeLayer.layer);
	stage.draw();
	
	// return;
	function beginRender () {
		$this.fInit.forEach(function (cb) {
			cb();
		});
		// window.stt = stage;
		var displayLayer = [0/* BG */, 2 /* Pass */, 3 /* FG */];
		displayLayer.forEach (function(currentLayer) {
			//try {
				stage.add($this.osbLayersK[currentLayer]);
				// $this.osbLayersK[currentLayer].moveToTop ();
			//} catch (e) {
			//	console.error (currentLayer);
			//}
			
			// Get hi & lo ready.
			$this.osbLayers[currentLayer].forEach (function (curLayer) {
				setTimeout (function () {
					curLayer.commands.forEach (function (thisFunc) {
						(thisFunc||function () {}) (curLayer.finalize ());
					});
				}, 0);
			});
		});
		$this.loadingMsg.layer.hide();
		// Time.
		$this.timeLayer.layer.show().moveToTop ();
		
		$($this.mainAudio).on ('ended', function (){
			window.stt = stage;
			cancelRequestAnimFrame($this.upd);
			//setTimeout (function () {
			//	stage.destroy ();
			//}, 3000);
			$(this).fadeOut (1000, function () {
				$(this).remove();
			});
		});
		
		$this.mainAudio.play();
		
		function renderThis () {
			$this.upd = requestAnimFrame (renderThis);
			
			if ($this.mainAudio.paused)
				return; // Only update frames when's playing.
			// console.log (1);
			stage.draw();
			
			// Call script objects.
			$this.timeLayer.labelTime2.setText (($this.time = $this.mainAudio.currentTime).toFixed(3));
			// console.log ('Rendering', $this.time);
			// Render every frame.
			displayLayer.forEach (function (currentLayer) {
				$this.osbLayers[currentLayer].forEach (function (curLayer) {
					setTimeout (function () {
						curLayer.commands.forEach (function (thisFunc) {
							(thisFunc||function () {}) (curLayer.dM ());
						});
					}, 0);
				});
			});
		}
		$this.upd = requestAnimFrame (renderThis);
		
		/*
		$this.upd = setInterval (function () {
			if ($this.mainAudio.paused)
				return; // Only update frames when's playing.
			// console.log (1);
			stage.draw();
			
			// Call script objects.
			$this.time = $this.mainAudio.currentTime;
			// console.log ('Rendering', $this.time);
			// Render every frame.
			displayLayer.forEach (function (currentLayer) {
				$this.osbLayers[currentLayer].forEach (function (curLayer) {
					setTimeout (function () {
						curLayer.commands.forEach (function (thisFunc) {
							(thisFunc||function () {}) (curLayer.dM ());
						});
					}, 0);
				});
			});
		}, 1);*/
	}

	var parseCommand = function (command) {
		var c = command.replace(/\s/g, '').split(',');
		for (var i=0; i<c.length; i++) {
			if (c[i] == '' || c[i] == '0')
				c[i] = 0;
			else
				c[i] = parseFloat(c[i]) || c[i].toUpperCase();
		}
		return c;
	}, generateFunc = function(c, d, e, noHi, alreadyParsedArgs){
		var oriCommand = c||alreadyParsedArgs.join(','); // make a local copy of the variable.
		// console.log ('Command: ', oriCommand);
		var command = oriCommand; // make a local copy of the variable.
		var $that = d;
		var conf = e;
		var cu = {};
		var currentCommand = (c ? (command.match(/^([A-Z]+),/)||[,false])[1] : alreadyParsedArgs[0]);
		// var aniConf = conf.aniConf;
		var args;
		if (c)
			args = parseCommand (command); // Safer way.
		else
			args = alreadyParsedArgs.slice(0);
		args.shift(); // Remove the command word.
		
		args[1] = osuTime2StandSec (args[1]);
		args[2] = osuTime2StandSec (args[2]);
		if (args[2] == 0)
			cu.timeRange = 1;
		else
			cu.timeRange = (args[2] - args[1]) || 1;
		
		cu.finalTime = (args[2]||args[1]) + 3;
		cu.finalized = false;
		
		// cu.__Ease = cu.timeRange;
		var easeFuncs = [
			// Normal, 0
			function () {
				return ($this.time - args [1]) / cu.timeRange;
			},
			// Easeing, 1
			function () {
				// return Math.pow (($this.time - args [1]) * cu.__Ease, .4);
				// return o+o - o*o;
				var o = ($this.time - args [1]) / cu.timeRange;
				return (Math.sqrt((o+o - o*o)));
			},
			// Easeing, 2
			function () {
				// return Math.pow (($this.time - args [1]) * cu.__Ease, 2);
				// return Math.pow (($this.time - args [1]) / cu.timeRange, 2);
				var o = ($this.time - args [1]) / cu.timeRange;
				return (1 - Math.sqrt((1-o*o)));
			}
		], easeCalc = easeFuncs[args[0]] || easeFuncs[0];
		
		
		
		var funcList = {
			// http://osu.ppy.sh/wiki/Storyboard_Scripting_Commands
			F: {
				cb: function (easing, startTime, endTime, opaStart, opaEnd) {
					// Fade in and out
					// console.log (cu.opaRange * ($this.time - args [1]));
					
					// ($this.time - startTime) / (endTime - startTime) <= curPercent in time
					// curPercent * cu.opaRange + opaStart <= Calc. opa
					
					$that.setOpacity (cu.opaRange * easeCalc () + args[3]);
					//$that.setOpacity (cu.opaRange * Math.sin (($this.time - args [1]) / cu.timeRange * Math.PI / 2) + args[3]);
					
					// (($this.time - args [1]) / cu.timeRange)
					// Math.sin (($this.time - args [1]) / cu.timeRange * Math.PI / 2)
				},
				init: function () {
					if (args.length < 5) {
						args[4] = args[3];
					}
					cu.opaRange = (args[4] - args[3]);
					//if (args[2] == 0) {
						// Apply now.
						// $that.setOpacity (args [4]);
						// General fix:
						// Ensure it fade out in that time.
						// args[2] = args[1] + 0.01;
					//}
					
					if (!$that.firstOpa) {
						$that.firstOpa = true;
						$that.setOpacity (args [3]);
					}
				}, 
				finalize: function () {
					//if (c == 'F,0,10485,0,0')
					//	console.log ('f!', args [4]);
					$that.setOpacity (args [4]);
				}
			},
			M: {
				cb: function (easing, startTime, endTime, xStart, yStart, xEnd, yEnd) {
					// Move from (x1, y1) to (x2, y2)
					// console.log(easeCalc ());
					$that.setPosition (cu.xRange * easeCalc () + args[3], cu.yRange * easeCalc () + args[4]);
					// console.log ('M: ', $that);
				},
				init: function () {
					// console.log ('M: init: (', args);
					if (args.length < 6) {
						args[5] = args[3];
						args[6] = args[4];
					}
//					console.log (args);
					/*
					if (!args[5])
						args[5] = args[3];
					if (!args[6])
						args[6] = args[4];
					*/
					// console.log ('M: init: (', args);
					
					cu.xRange = (args[5] - args[3]);// / cu.timeRange;
					cu.yRange = (args[6] - args[4]);// / cu.timeRange;
					if (!$that.noPosfix) {
						$that.noPosfix = true;
						$that.setPosition (args [3], args [4]);
					}
					//if (args[2] == 0) {
						// Apply fix.
						//$that.setPosition (args [5], args [6]);
						//$that.noPosfix = true;
						
						//console.log ('applyFix: ', $that.getPosition());
						// args[2] = args[1] + 0.01;
					//}
				}, 
				finalize: function () {
					// console.log('Final?', args[5], args[6]);
					$that.setPosition (args [5], args [6]);
				}
			},
			MX: {
				cb: function (easing, startTime, endTime, xStart, xEnd) {
					// Move from (x1) to (x2)
					$that.setX (cu.xRange * easeCalc () + args[3]);
				},
				init: function () {
					if (args.length < 5) {
						args[4] = args[3];
					}
					
					cu.xRange = (args[4] - args[3]); // / cu.timeRange;
					if (!$that.noPosfix) {
						$that.noPosfix = true;
						$that.setX (args [3]);
					}
					//if (args[2] == 0) {
						// Apply now.
						//$that.noPosfix = true;
						//$that.setX (args [4]);
						// args[2] = args[1] + 0.01;
					//}
				}, 
				finalize: function () {
					$that.setX (args [4]);
				}
			},
			MY: {
				cb: function (easing, startTime, endTime, xStart, xEnd) {
					// Move from (y1) to (y2)
					$that.setY (cu.yRange * easeCalc () + args[3]);
					// console.log ('MY: ', $that);
				},
				init: function () {
					if (args.length < 5) {
						args[4] = args[3];
					}
					cu.yRange = (args[4] - args[3]);// / cu.timeRange;
					if (!$that.noPosfix) {
						$that.noPosfix = true;
						$that.setY (args [3]);
					}
					//if (args[2] == 0) {
						// Apply now.
						// = true;
						//$that.setY (args [4]);
						// args[2] = args[1] + 0.01;
					//}
				}, 
				finalize: function () {
					$that.setY (args [4]);
				}
			},
			S: {
				cb: function (easing, startTime, endTime, sStart, sEnd) {
					// zoom
					$that.setScale(cu.sRange * easeCalc () + args[3]);
				},
				init: function () {
					if (args.length < 5)
						args[4] = args[3];
					cu.sRange = (args[4] - args[3]);// / cu.timeRange;
//					if (args[2] == 0) {
						// Apply now.
						//$that.setScale (args [4]);
						// args[2] = args[1] + 0.01;
//					}
					if (!$that.firstScale) {
						$that.firstScale = true;
						$that.setScale (args [3]);
					}
				}, 
				finalize: function () {
					$that.setScale (args [4]);
				}
			},
			V: {
				cb: function (easing, startTime, endTime, xsStart, ysStart, xsEnd, ysEnd) {
					// Zoom x and y
					$that.setScale(cu.xsRange * easeCalc () + args[3], cu.ysRange * easeCalc () + args[4]);
				},
				init: function () {
					if (args.length < 6) {
						args[5] = args[3];
						args[6] = args[4];
					}
					cu.xsRange = (args[5] - args[3]);// / cu.timeRange;
					cu.ysRange = (args[6] - args[4]);// / cu.timeRange;
					//if (!cu.xsRange || !cu.ysRange)
					//	cu.debug && console.log (oriCommand, cu, args);
						
					//if (args[2] == 0) {
						// Apply now.
						//$that.setScale (args [5], args [6]);
						// args[2] = args[1] + 0.01;
					//}
					if (!$that.firstScale) {
						$that.firstScale = true;
						$that.setScale (args [3], args [4]);
					}
				}, 
				finalize: function () {
					$that.setScale (args [5], args [6]);
				}
			},
			R: {
				cb: function (easing, startTime, endTime, rStart, rEnd) {
					// rotate, in radius.
					// console.log ('rotate: ', cu.rRange * ($this.time - args [1]) + args[3]);
					$that.setRotation(cu.rRange * easeCalc () + args[3]);
					// console.log ('rotate: ', cu.rRange * ($this.time - args [1]) + args[3]);
				},
				init: function () {
					if (args.length < 5)
						args[4] = args[3];
					
					cu.rRange = (args[4] - args[3]);// / cu.timeRange;
					//if (args[2] == 0) {
						// Apply now.
						//$that.setRotation (args [4]);
						// args[2] = args[1] + 0.01;
					//}
					if (!$that.firstRotate) {
						$that.firstRotate = true;
						$that.setRotation (args [3]);
					}
				}, 
				finalize: function () {
					$that.setRotation (args [4]);
				}
			},
			P: {
				cb: function (easing, startTime, endTime, flipMethod) {
					// Which is the flip of an image?
					// TODO: Fix this later.
					if (cu.flip)
						return;
					cu.flip = true;
					cu.fl ();
				},
				init: function () {
					cu.fM = 'HVA'.indexOf (args[3].substr(0,1));
					cu.fN = ['X','Y'][cu.fM];
					cu.fW = ['Width','Height'][cu.fM];
					cu.fV = -1;
					cu.fl = function () {
						// console.log ('flip: ', cu);
						$that.children.forEach (function (e) {
							var tF = e['getScale' + cu.fN] () * -1;
							// console.log (tF);
							e['setOffset' + cu.fN] (tF == -1 ? e['get' + cu.fW]() : 0);
							e['setScale' + cu.fN] (tF);
						});
					};
					cu.fl ();
				}, 
				finalize: function () {
					// if not defined end time, don't recover.
					if (args[2])
						cu.fl (); // Flip it back
				}
			},
			C: {
				cb: function (easing, startTime, endTime, rs3, gs4, bs5, ra6, ga7, ba8) {
					// Colour filter...?
					// return; // It's too laggy, only render last frame.
					// console.log ($that.children);
					//cu.colourDrop = !cu.colourDrop;
					//if (cu.colourDrop)
					//	return /*console.log ('drop colour frame.')*/;
					if ($that.cD % 3 != 0)
						// Drop frame.
						return $that.cD = (++$that.cD) % 3;
					
					var cC = [
							parseInt(cu.rRange * easeCalc () + args[3]) || 255,
							parseInt(cu.gRange * easeCalc () + args[4]) || 255,
							parseInt(cu.bRange * easeCalc () + args[5]) || 255
					];
					// Do not change the colour if it's no change at all.
					if (!(cC<$that.colourConf || $that.colourConf<cC))
						return console.log ('Colour frame dropped.');
					$that.colourConf = cC;
					$that.children.forEach (function (i) {
						i.setFilterColorizeColor(cC);
						i.setFilter (Kinetic.Filters.Colorize);
					});
				},
				init: function () {
					if (args.length < 7) { // Fix missing params.
						args [6] = args [3];
						args [7] = args [4];
						args [8] = args [5];
					}
					if (!$that.cD)
						$that.cD = 0;
					cu.rRange = (args[6] - args[3]);// / cu.timeRange;
					cu.gRange = (args[7] - args[4]);// / cu.timeRange;
					cu.bRange = (args[8] - args[5]);// / cu.timeRange;
					if (!$that.colourConf) {
						$that.colourConf = [args [3], args[4], args[5]];
						// console.log ('pre-Render: ', $that.colourConf);
						$that.children.forEach (function (i) {
							i.setFilterColorizeColor($that.colourConf);
							i.setFilter (Kinetic.Filters.Colorize);
						});
					}
					// console.log (cu);
				}, 
				finalize: function () {
					// console.log ($that.children);
					
					$that.children.forEach (function (i) {
						i.setFilterColorizeColor([
							args[6], args[7], args[8]
						]);
						
						i.setFilter (Kinetic.Filters.Colorize);
					});
				}
			}
		};
		
		if (!currentCommand){
			// Unable to match the command.
			console.error ('Unable to match command, is it invalid?  =>', oriCommand);
			return emptyFunc;
		}
		switch (currentCommand) {
			case 'T':
				console.error ('Unsupported command :(', oriCommand);
				break;
			default:
				var retFunc = funcList[currentCommand], finalFunc;
				
				if (retFunc && retFunc.init) {
					regInit (retFunc.init);
					// retFunc.init ();
					finalFunc = retFunc.finalize;
					retFunc = retFunc.cb;
				}
		}
		if (!retFunc) {
			console.error ('Invalid or unsupported command:', oriCommand);
			retFunc = finalFunc = function () {};
		} else if (!noHi) {
			conf.hi (args[2] || args[1]);
			conf.lo (args[1]);
		}
//		console.log (cu);
		return function (withInTime) {
			/*
			* TODO: Complete this loader.
			*     * Completed.
			* The callback function loader.
			* E.g. Check the time before send it to the actual function to save resource.
			* */
			// window.arggg = args;
			if (withInTime && args[1] <= $this.time && args[2] >= $this.time) {
				// console.log ('render:', args[1], args[2], $this.time);
				// if (!$that.getVisible())
				// $that.moveToTop (); //.moveToBottom();
				cu.finalized = false;
				retFunc.call (this, args);
			} else if (!cu.finalized && args[1] <= $this.time /*&& cu.finalTime >= $this.time*/) {
				cu.finalized = true;
				finalFunc ();
			}
			// console.log (command);
			// console.log ('finalize: ', c, cu.finalized, args[1] <= $this.time, cu.finalTime >= $this.time);
			// retFunc.call (this, params);
		};
	};
	
    function loadRes (resList/* String Array */,
                      sCallback /* Callback after finish */,
					  pCallback /* Callback after load a resource */,
                      fCallback /* Callback if one's took too long to load */,
                      nTimeout /* How long should it wait maximum for each resource */) {
        var currentPos = -1,
            maxIndex = resList.length - 1,
            resLoaded = [];

        function loadNextRes () {
            if (++currentPos > maxIndex) {
                sCallback (resLoaded);
                return ;
            }
            $.ajax ({
                url: resList[currentPos],
                cache:true,
                timeout: nTimeout,
                success: function (r) {
					setTimeout (function () {
						pCallback (currentPos);
					}, 0);
                    resLoaded.push (r);
                    loadNextRes ();
                },
                error: fCallback
            });
        }
        loadNextRes ();
    }

    loadRes([$osuConfig.basePath + $osuConfig.osuPath, $osuConfig.basePath + $osuConfig.osbPath], function (r) {
        // Success!
        $this.loadingMsg.text.setText ('Download success! Parsing file...');
        stage.draw();
        $this.osuData = r[0].replace(/\r/g, '');
        $this.osbData = r[1].replace(/\r/g, '');
        // setTimeout(parseOsu, 0);
        setTimeout(parseOsb, 0);
    }, function () {
		// Do nothing.
	}, function () {
        // Failed!
        $this.loadingMsg.text.setText ('Error while loading resource:' + JSON.stringify(arguments));
        stage.draw();
    }, 10000);

    // Fix osb Layers
    function pushLayer ($config) {
		var nLayer = new Kinetic.Group ();
		nLayer.hide();
		// nLayer.setOpacity (0);
		$this.osbLayersK[$config.layer].add (nLayer);
		
		var isAni = $config.ani;
		var aniConf = $config.aniConf;
		//var bAlwaysShown = isAni && aniConf.bLoopForever;
		//var bAlwaysShown = false;
		var minHiDiff = 0;
		var curFrame = -1;
		var fallbackObj = {show: emptyFunc, hide: emptyFunc};
		var frameTime = aniConf.frameDelay / 1000 / ($osuConfig.animationSpeed || 1);
		var stopAtTime;
		// for some reason "Don't stop me now" requires 4000 instead?
		
		var thisHiLo = {
			hi: 0,
			lo: 0
		};
		
		if (isAni) {
			/*
			setTimeout (function () {
				console.log ('Animation: ', aniConf, thisHiLo);
			}, 3000);
			*/
			
			if (!aniConf.bLoopForever) {
				stopAtTime = frameTime * aniConf.frameCount;
			}
				
				// TODO: Only render animation once.
				// Loop once and that's it.
				// minHiDiff = frameTime * aniConf.frameCount;
			//} //else {
				// bAlwaysShown = true;
				// Loop forever.
			//}
		}
		
		thisHiLo.lo = -1;
		
		var switchFrame = (isAni ? function () {
			var currentPoint = $this.time - thisHiLo.lo;
			if (!aniConf.bLoopForever && currentPoint > stopAtTime) {
				return ; // Only render once and finished.
			}
			
			// check with frame.
			var ccurFrame = Math.floor (currentPoint / frameTime) % aniConf.frameCount;
			if (ccurFrame != curFrame) {
				// update current frame.
				var nC = nLayer.children;
				(nC [curFrame] || fallbackObj).hide ();
				curFrame = ccurFrame;
				(nC [curFrame] || fallbackObj).show ();
				
				// console.log ('switch frame:', ccurFrame);
			}
			// Else doing nothing. - No need to update.
		} : emptyFunc);
		
		// console.log (switchFrame);
		
        var ret = $this.osbLayers[$config.layer].push({
            layer: nLayer,
            commands: [],
            origin: $config.origin,
            xyOffset: {},
            path: $config.path,
            x: $config.x,
            y: $config.y,
            isAni: isAni,
            aniConf: aniConf,
            fRender: function () {},
			hi: function (nHi) {
				if (thisHiLo.hi < nHi)
					thisHiLo.hi = nHi/*, console.log ('update Hi:', nHi)*/;
			},
			lo: function (nLo) {
				if (thisHiLo.lo == -1 || thisHiLo.lo > nLo)
					thisHiLo.lo = nLo/*, console.log ('update Lo:', nLo)*/;
			},
			dM: function () {
				// console.log (arguments);
				var flagA = $this.time > thisHiLo.lo;
				var ret = (flagA && thisHiLo.hi > $this.time);
				
				// nLayer.hide ();
				// console.log (ret);
				if (/*(bAlwaysShown && flagA) ||*/ ret) {
					switchFrame ();
					if (!nLayer.getVisible())
						nLayer.show ();
					//nLayer.moveToTop ();
					//nLayer.moveToTop();
					// return true;
				} else {
					nLayer.hide ();
					// return false;
					// console.log (nLayer);
				}
				return ret;
			},
			finalize: function () {
				// Get animation hi & lo ready.
				// Or maybe not needed?
				/*
				if (thisHiLo.hi - thisHiLo.lo < minHiDiff) {
					thisHiLo.hi = thisHiLo.lo + minHiDiff
				}
				*/
				// console.log (thisHiLo);
			}
        }) - 1;
		$this.osbLayers[$config.layer][ret].image = $config.image (nLayer, $config.origin);
		return {
			i: ret,
			layer: nLayer
		};
    }

    function osuTime2StandSec (str) {
        return Number(str)/1000;
    }
	/*
    function parseOsu () {
		// TODO: read osu file
    }
	*/
	
	function loadImgs (status) {
		/* status
		 *  1- Load Success.
		 *  2- Load Failed
		 *  Other- New counter.
		 */
		if (status) {
			$this.iF ++;
		} else {
			$this.iC ++;
		}
		
        $this.loadingMsg.text.setText ('Loading image: ' + $this.iF + '/' + $this.iC + '...');
        stage.draw();
		
		if ($this.iF == $this.iC) {
			// Load finish!
			$this.loadingMsg.anim.stop ();
			beginRender ();
		}
	}
	
    function parseOsb () {
		var osuData = $this.osuData.match (/\[Events\]\n([\s\S]+?)\n\[/m);
		if (osuData)
			$this.osbData = osuData[1] + '\n' + $this.osbData;
		
		// Convert background to image object.
		$this.osbData = $this.osbData.replace(/^(\d+,\d+),(".+?")(|,\d+,\d+)$/gm, 
								'Sprite,Background,FillScreen,$2,$1\n' +
								' S,0,0,999999,1\n');
		// console.log ($this.osbData);
		
        var d = $this.osbData.replace(/,\s+/g, ',').replace(/,,/g, ',0,').split('\n'),
            workingLayers = 'Background|Fail|Pass|Foreground'.split('|'),
            workingOffset = 'TopLeft|TopCentre|TopRight|CentreLeft|Centre|CentreRight|BottomLeft|BottomCentre|BottomRight|FillScreen'.split('|'),
            currentLayer = 0,
            cLine = -1,
            topLine = d.length,
			curLayer,
			cap = false,
			curLevel, curLine;
		
        var movieStartTime = 0;
        var thisIndex = -1;
		
		function fetchNextLine () {
			// console.warn(printStackTrace ().join ('\n'));
			if (++cLine >= topLine)
				return 0;
			
			curLine  = d[cLine].replace(/(^[\s_]+|[\s_]+$)/g, '');
			if (/(^\s*\/\/|\[|^\s*$)/.test(curLine))
				return fetchNextLine(); // If it's a comment or empty line, fetch it again.
			
			curLevel = (d[cLine].match(/^\s+/g)||[''])[0].length;
			// console.log (cLine, curLine);
			return [curLevel, curLine];
		}
		
        while (true) {
			var thisLine = fetchNextLine ();
            if (thisLine === 0)
                break;
			
            // curLine = curLine.replace(/(^[\s_]+|[\s_]+$)/g, '');
			
			/*
			// Filter out comments.
            if (/^\s*\/\/|\[/.test(curLine.replace(/\s/g,'')) /* || curLevel > 1  Not supporting loop * /)
                continue;
            */
			
			cap = curLine.match (/(Sprite|Animation),(Background|Fail|Pass|Foreground),(TopLeft|TopCentre|TopRight|CentreLeft|Centre|CentreRight|BottomLeft|BottomCentre|BottomRight|FillScreen),"(.+?)",([\d-]+),([\d-]+)($|,([\d-]+),([\d-]+),(LoopForever|LoopOnce))/);
			
            if (cap) { // curLevel = 0: Sprite or Animation
				// console.log (curLevel, curLine);
				var isAni = cap[1] == 'Animation';
				var aniConf = {
                    frameCount: Number(cap[8]),
                    frameDelay: Number(cap[9]),
                    bLoopForever: cap[10] == 'LoopForever'
				};
				currentLayer = workingLayers.indexOf (cap[2]);
                var curRet = pushLayer({
                    layer: currentLayer,
                    origin: cap[3],
                    path: cap[4],
                    x: Number(cap[5]),
                    y: Number(cap[6]),
                    ani: isAni,
					aniConf: aniConf,
                    image: (function () {
						var caps = cap;
						var isAniLocal = isAni;
						return (function (curObj, origin) {
							var imageObj = [], imageLoaded = '';
							var oId = workingOffset.indexOf (origin);
							var fixSt = oId == 9;
							var aConf = aniConf;
							if (fixSt)
								oId = 0;
							// console.log ('OffsetId:', oId);
							function pushImg (imgPath) {
								function createImg () {
									loadImgs (0);
									var newImage = new Image ();
									newImage.onload = function() {
										var that = this; // Make a local copy
										imageLoaded = true;
										
										var offsetLeft = (oId % 3) / 2 * this.width;
										var offsetTop  = (oId - (oId % 3)) / 6 * this.height;
										
										/*
										var offsetLeft = 0, 
											offsetTop  = 0;
										
										switch (oId) {
											case 0: // TopLeft
												// Do nothing.
												break;
											case 1: // TopCentre
												offsetLeft = this.width / 2;
												break;
											case 2: // TopRight
												offsetLeft = this.width;
												break;
											
											
											case 3: // CentreLeft
												offsetTop = this.height / 2;
												break;
											case 4: // Centre
												offsetLeft = this.width / 2;
												offsetTop = this.height / 2;
												break;
											case 5: // CentreRight
												offsetLeft = this.width;
												offsetTop = this.height / 2;
												break;
											
											
											// BottomLeft|BottomCentre|BottomRight
											case 6:
												offsetTop = this.height;
												break;
											case 7:
												offsetTop = this.height;
												offsetLeft = this.width / 2;
												break;
											case 8:
												offsetTop = this.height;
												offsetLeft = this.width;
												break;
										}
										*/
										
										var kImg = new Kinetic.Image({
											image: newImage
										});
										// offsetLeft *= -1;
										// offsetTop  *= -1;
										
										/*console.log ('fix origin: ', caps[0], 'with offset ('
											+ offsetLeft + ', ' + offsetTop + ')',
											', image size (' + this.width + ', ' + this.height + ')');
										*/
										curObj.setOffset (offsetLeft, offsetTop);
										
										if (!curObj.noPosfix) {
											curObj.noPosfix = true;
											curObj.setPosition (Number(caps[5]), Number(caps[6]));
										}
										//else 
											//console.log ('noPosfix for', newImage);
										// console.log (kImg.getPosition());
										curObj.add(kImg);
										
										if (isAniLocal)
											kImg.hide();
										if (fixSt) {
											// console.log ('fix Strech:', 480 / this.width);
											kImg.setScale( 480 / this.height );
										}
										loadImgs (1);
									};
									newImage.onerror = function () {
										console.warn ('Img load failed: ', this.src);
										loadImgs (2);
									}
									return newImage;
								}
								if (isAniLocal) {
									// Is animation
									// Image?.png
									var begin = $osuConfig.basePath + imgPath.substr(0, imgPath.length - 4);
									var end   = imgPath.substr(-4);
									for (var i=0; i<aConf.frameCount; i++) {
										var myImg = createImg ();
										myImg.src = (begin + i + end).replace(/\\/g, '/');
										imageObj.push (myImg);
									}
								} else {
									var myImg = createImg ();
									myImg.src = ($osuConfig.basePath + imgPath).replace(/\\/g, '/');
									imageObj.push (myImg);
									// console.log (imageObj);
								}
							}
							
							pushImg (cap[4]);
							
							// Don't really need to return anything I guess?
							return {
								/* callbacks for extenal use */
								kImage: function () { return imageObj },
								loaded: function () { return imageLoaded }
							};
						})
					})()
                });
				thisIndex = curRet.i;
				curLayer = curRet.layer;
                // console.log ('pushLayer: ', curLine, '; thisIndex: ', thisIndex);
                continue;
            } else if (thisIndex < 0 || curLevel <= 0 /* If the line's suppose to be an object, curLevel should >= 1 */) {
                // console.warn (thisIndex);
                console.error ('Invalid or unsupported statement:', curLine);
                continue;
            }

            // Commands
            
			(function () {
				// console.log (curLevel, fetchedLines);
				var fetchedLines = [{l: curLine, s: curLevel}],
					maxFetchedMember = 0;
				// console.log (curLevel, fetchedLines.length, fetchedLines);
				var nLine = '';
				var targetLevel = curLevel,
					lastLine = cLine,
					numSpace = [{s: 1, c: 0}];
				
				while (true) {
					nLine = fetchNextLine ();
					if (nLine == 0)
						break; // This is last command already.
					// console.warn (nLine [0], stopAtLevel);
					// console.log ('CurrentLevel: ', nLine [0], 'TargetLevel:', targetLevel);
					
					if (nLine [0] == 0)
						break; // If the line is an object, then stop fetching lines.
					
					// check if it needs to push a new one
					if (nLine[0] != fetchedLines[maxFetchedMember].s) {
						numSpace.push ({s: nLine[0], c: 1});
						// console.log ('numSpace: push counter', numSpace.length - 1);
					} else { // If it's same number of space, inc. by 1.
						numSpace [numSpace.length - 1].c ++;
						// console.log ('numSpace: add 1 to', numSpace.length - 1);
					}
					maxFetchedMember = fetchedLines.push ({l: nLine[1], s: nLine[0]}) - 1;
					lastLine = cLine;
				}
				numSpace.shift();
				var newNumSpace = [];
				numSpace.forEach (function (e) {
					if (e.s != 1)
						newNumSpace.push (e);
				});
				numSpace = newNumSpace;
				// console.log ('numSpace', numSpace.slice(0));
				
				
				// Set it back...
				cLine = lastLine;
				var loopStart = 0,
					loopCount = 0,
					timeOffset = 0,
					spaceOffset = -1,
					parsedArgs = [],
					tmp, thisLine, curHi, tmpHi, curArgs;
				var thisIndexLayer = $this.osbLayers[currentLayer][thisIndex];
//				console.log (cLine);
				
				var i = -1;
				// console.log ('fetchedLines:', fetchedLines);
				while (true) {
					if (++i >= fetchedLines.length)
						break; // All lines has parsed.
					// var thisCurLine = fetchedLines[i++];
					
					thisLine = fetchedLines[i];
					
					// console.warn(thisLine);
					
					// _L,<starttime>,<loopcount>
					var matchedLoop = thisLine.l.match(/^L,([\d-]*),([\d-]*)/);
					if (matchedLoop) {
						// Setup loops.
						// console.log ('matchedLoop');
						loopStart = parseInt (matchedLoop[1]);
						loopCount = parseInt (matchedLoop[2]); // +1?
						// console.log ('loopStart', loopStart, 'loopCount', loopCount);
						//thisIndexLayer.lo (loopStart / 1000);
					} else if (thisLine.s > 1) {
						// Inside a loop
//						console.log (thisLine.s);
						curHi = 0;
						// Find the max time for one go.
						spaceOffset++;
						parsedArgs = []; // Clear everytime.
						// console.log ('spaceOffset', spaceOffset, numSpace[spaceOffset]);
						for (var j=0; j<numSpace[spaceOffset].c; j++) {
							// console.log ('j:', j, 'fetchedLines[i+j]:', fetchedLines[i + j]);
							tmp = parsedArgs[parsedArgs.push (parseCommand (fetchedLines[i + j].l)) - 1];
							// CommandName 0, Easing 1, StartingTime 2, EndingTime 3, params, ...
							tmpHi = tmp[3] /* relative_endtime */ || tmp[2] /* relative_starttime */;
							//console.log ('tmpHi', tmpHi, 'temp', tmp);
							if (tmpHi > curHi)
								curHi = tmpHi;
						}
						// console.log ('curHi', curHi);
						// spaceOffset = 0;
						for (var j=0; j<numSpace[spaceOffset].c; j++) {
							timeOffset = loopStart;
							curArgs = parsedArgs[j].slice(0);
							curArgs [3] = curArgs [3] || curArgs [2];
							curArgs [2] += timeOffset;
							curArgs [3] += timeOffset; // Incase the endtime's empty.
							
							// console.log ('curArgs: ', curArgs);
							
							for (var k=0; k<loopCount; k++) {
								// console.log ('curArgs with fix:', k, curArgs);
								thisIndexLayer.commands.push (generateFunc(
									false /* command will be fetched in 5th param */,
									curLayer, thisIndexLayer, false /* NoHi */, curArgs /* alreadyParsedArgs */
								));
								curArgs [2] += curHi;
								curArgs [3] += curHi;
							}
							//thisIndexLayer.hi ((curArgs [3] - curHi) / 1000);
							// console.log (thisIndexLayer);
						}
						i += numSpace[spaceOffset].c - 1;
						// Indide the loop, require fix.
					} else {
						// Normal command.
						// console.log ('Normal Command:', thisLine.l);
						thisIndexLayer.commands.push (generateFunc(
							thisLine.l, curLayer, thisIndexLayer, false
						));
//						console.log (thisIndexLayer.commands);
					}
				}
			})();
			// console.log (curLayer);
        }

        $this.loadingMsg.text.setText ('Parse finish! For details please review console log.\n' +
            'Now downloading resources...');
        stage.draw();
    }
	return $this;
}