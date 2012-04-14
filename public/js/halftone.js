/*
 * halftone.js
 * 
 * Author: Peter Jaric (@peterjaric, http://javahacker.com)
 * 
 * Port of my xscreensaver hack Halftone from 2002.
 * (two for and one against at http://www.jwz.org/blog/2006/03/screen-savers-that-suck/).
 *
 * Features:
 * . Adapts to full size of window when it is resized.
 * . Dynamically changes number of dots depending on time
 *   spent drawing to keep a good user experience.
 */

 var c = document.getElementById('canvasElt');  
 var a = c.getContext('2d');
 
 
// We want to go full screen
S = document.body.style;
S.overflow = "hidden";
S.margin = "0px";

// Some shortcuts
M = Math;
r = M.random;
n = M.min;
D = Date;

// Spacing between dots
s = 30;
// Moving mass centers (3 of them)
nm=2;
m = [];
for (i = 0; i < nm;  m[i++] = {x: r(), y:r(), // position
                              dx: r() * 0.03, dy:  r() * 0.03, // speed
                              m:r() * 0.10 // mass
                             });

// Call main function every 50 ms
if(1) setInterval(function() {
                // Record timestamp
                t = +new D();
                
                // Resize (to full screen) and clear canvas
                W = window;
                w = W.innerWidth,
                h = W.innerHeight;
                c.width = w;
                c.height = h;
                
                // Move mass centers
                for (i = 0; i < nm;) {
                    g = m[i++];
                    g.x += g.dx;
                    g.y += g.dy;
                    
                    if (g.x > 1 || g.x < 0) 
                        g.dx = -g.dx;
                    if (g.y > 1 || g.y < 0)
                        g.dy = -g.dy;
                }
                
                // Draw all dots
                for (x = 0; x <= w; x+=s) 
                    for (y = 0; y <= h; y+=s) {
                        // Intensity in this dot
                        I = 0;
                        // Sum influence from all mass centers
                        for (i = 0; i < nm;) {
                            g = m[i++];
                            X = x - g.x * w; // x distance
                            Y = y - g.y * h; // y distance
		            d = M.sqrt(X * X + Y * Y) / (h + w); // dance between current mass center and current dot
		            
                            I += !d ? 2 : n(g.m / (d * d * 20), 2); // Add influence from current mass center (but not too much!)
                        }
                        // Draw the dot: a circle drawn with Context2D.arc and then filled
                        a.fillStyle = "rgba(200,200,200,0.5)";  
                        a.beginPath();
                        a.arc(x + .5, y + .5, n(I, 9) * s * .5, 0, 7, 0);
                        a.fill();
                    }
                
                // Calculate the elapsed time for this call
                e = +new D() - t;
                // If the time was too short, half the spacing between dots
                // if (e < 20) s /= 2;
                // If the time was too long, increase spacing by 8 pixels
                // if (e > 70) s += 8;
            }, 100);
