/**
 * dil.js
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2017, Codrops
 * http://www.codrops.com
 */
{
    // Check if clip-path is supported. From http://stackoverflow.com/a/30041538.
	const areClipPathShapesSupported = () => {
		const base = 'clipPath';
		const prefixes = [ 'webkit', 'moz', 'ms', 'o' ];
		const testElement = document.createElement( 'testelement' );
		const attribute = 'polygon(50% 0%, 0% 100%, 100% 100%)';

		let properties = [ base ];

		// Push the prefixed properties into the array of properties.
		for ( let i = 0, l = prefixes.length; i < l; i++ ) {
			const prefixedProperty = prefixes[i] + base.charAt( 0 ).toUpperCase() + base.slice( 1 ); // remember to capitalize!
			properties.push( prefixedProperty );
		}

		// Interate over the properties and see if they pass two tests.
		for ( let i = 0, l = properties.length; i < l; i++ ) {
			const property = properties[i];

			// First, they need to even support clip-path (IE <= 11 does not)...
			if ( testElement.style[property] === '' ) {

				// Second, we need to see what happens when we try to create a CSS shape...
				testElement.style[property] = attribute;
				if ( testElement.style[property] !== '' ) {
					return true;
				}
			}
		}
		return false;
	};

	// Random integer.
	const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

	class DualImageLayout {
		constructor(el, options) {
			this.DOM = {};
			this.DOM.el = el;
			this.options = {
                images: {
					even: 'img/even.jpg', // image used for the even slices
					odd: 'img/odd.jpg' // image used for the odd slices
				},
				orientation: 'vertical',
				slices: 10,
				width: '100vw', // [number]vw || [number] in pixels
				height: '100vh', // [number]vh || [number] in pixels
				gap: 0, // gap between the slices
				layout: 'full', // || 'offset'
				visible: 'both' // || 'none' || 'even' || 'odd' || 'both'
			};
			Object.assign(this.options, options);
			this.visibleSlices = this.options.visible;
			this.totalSlices = this.options.slices < 2 ? 2 : this.options.slices;
			this.layout();
        }
        // preload the images that are passed in options.images.
        load() {
            return new Promise((resolve, reject) => {
                const bodyEl = document.body;
                const imgEven = document.createElement('img');
                const imgOdd = document.createElement('img');
                imgEven.src = this.options.images.even;
                imgOdd.src = this.options.images.odd;
                bodyEl.appendChild(imgEven);
                bodyEl.appendChild(imgOdd);
                imagesLoaded(bodyEl, { background: true }, () => {
                    bodyEl.removeChild(imgEven);
                    bodyEl.removeChild(imgOdd);
                    resolve();
                });
            });
        }
		layout() {
            // clip-path support
			const clipPathSupport = areClipPathShapesSupported();
			
			if ( clipPathSupport ) {
				const width = typeof this.options.width === 'number' ? `${this.options.width}px` : this.options.width;
				const height = typeof this.options.height === 'number' ? `${this.options.height}px` : this.options.height;
				const gap = `${this.options.gap}px`;
				let innerHTML = '';
				for (let i = 0; i < this.totalSlices; i++) {
					innerHTML += `<div class="slice slice--${i % 2 === 0 ? 'even' : 'odd'}">`;
					innerHTML += `<div class="slice__inner">`;
					const left = `calc(-${width} / ${this.totalSlices} * ${i})`;
					const top = `calc(-${height} / ${this.totalSlices} * ${i})`;
					let x1 = `calc(100%/${this.totalSlices} * ${i} - 1px)`;
					let x2 = `calc(100%/${this.totalSlices} * ${(i+1)} + 1px)`;
					let y1 = 0;
					let y2 = '100%';
					const clippath = this.options.orientation === 'vertical' ? `polygon(${x1} ${y1}, ${x2} ${y1}, ${x2} ${y2}, ${x1} ${y2})` : `polygon(${y1} ${x1}, ${y2} ${x1}, ${y2} ${x2}, ${y1} ${x2})`;
					const bgimage = i % 2 === 0 ? `url(${this.options.images.even})` : `url(${this.options.images.odd})`;
					innerHTML += this.options.orientation === 'vertical' ? `<div class="slice__bg" style="background-image: ${bgimage}; left: ${left}; -webkit-clip-path: ${clippath}; clip-path: ${clippath};"></div>` : `<div class="slice__bg" style="background-image: ${bgimage}; top: ${top}; -webkit-clip-path: ${clippath}; clip-path: ${clippath};"></div>`;
					innerHTML += `</div></div>`;
				};
				this.DOM.el.innerHTML = innerHTML;
				this.DOM.slices = {
					all: Array.from(this.DOM.el.querySelectorAll('.slice')),
					get even() { return this.all.filter(slice => slice.classList.contains('slice--even')) },
					get odd() { return this.all.filter(slice => slice.classList.contains('slice--odd')) }
				};
				this.DOM.el.classList.add(`slices--${this.options.orientation}`);

				this.DOM.el.style.setProperty('--slices-width', width);
				this.DOM.el.style.setProperty('--slices-height', height);
				this.DOM.el.style.setProperty('--slices', this.options.slices);
				this.DOM.el.style.setProperty('--gap', gap);
				
				if ( this.options.layout === 'offset' ) {
					this.DOM.el.classList.add('slices--layout-offset');
				}
				
				this.setGlitch();
				this.setSlicesStyle();
			}
			else {
				this.DOM.el.classList.add('slices--fallback');
			}
		}
		setSlicesStyle() {
			if ( this.visibleSlices !== 'both' ) {
				const slices = this.visibleSlices === 'none' ? this.DOM.slices.all : this.DOM.slices[this.visibleSlices === 'odd' ? 'even' : 'odd'];
				slices.forEach(slice => slice.querySelector('.slice__inner').style.opacity = 0);
			}
		}
		setGlitch() {
			this.gfxArr = [];
			this.DOM.slices.all.forEach(slice => {
				const dim = this.options.orientation === 'vertical' ? slice.offsetWidth : slice.offsetHeight;
				this.gfxArr.push(new GlitchFx(slice, {
					// Max and Min values for the time when to start the effect.
					glitchStart: {min: 100, max: 2500},
					// Max and Min values of time that an element keeps each state.
					glitchState: {min: 50, max: 100},
					// Number of times the glitch action is performed per iteration.
					glitchTotalIterations: 5,
					glitchStateProperty: this.options.orientation === 'vertical' ? 'right' : 'top',
                	glitchStateValue: () => getRandomInt(-1*dim*0.5,dim*0.5) + 'px',
                	glitchStateValueReset: '0px'
				}));
			});
		}
        // Sets a new image for the slices.
		// sliceCode: 'even' || 'odd' || 'both'
		setBG(imgurl, sliceCode) {
            return new Promise((resolve, reject) => {
                // first preload the image.
                const bodyEl = document.body;
                const img = document.createElement('img');
                img.src = imgurl;
                bodyEl.appendChild(img);
                imagesLoaded(bodyEl, { background: true }, () => {
                    bodyEl.removeChild(img);
                    const slices = sliceCode === 'both' ? this.DOM.slices.all : this.DOM.slices[sliceCode];
                    slices.forEach((el) => el.querySelector('.slice__bg').style.backgroundImage = `url(${imgurl})`);
                    resolve();
                });
            });
		}
		setGap(val) {
			this.DOM.el.style.setProperty('--gap', val);
		}
		// sliceCode: 'even' || 'odd' || 'both'
		show(sliceCode) {
			this.trigger('show', sliceCode);
		}
		// sliceCode: 'even' || 'odd' || 'both'
		hide(sliceCode) {
			this.trigger('hide', sliceCode);
		}
		// action: 'show' || 'hide'
		// sliceCode: 'even' || 'odd' || 'both'
		trigger(action, sliceCode) {
			if ( sliceCode !== 'even' && sliceCode !== 'odd' && sliceCode !== 'both' ) {
				sliceCode = 'both';
			}
			this.visibleSlices = sliceCode;
			const slices = sliceCode === 'both' ? this.DOM.slices.all : this.DOM.slices[sliceCode];
            slices.forEach(slice => slice.querySelector('.slice__inner').style.opacity = action === 'show' ? 1 : 0);
        }
        // sliceCode: 'even' || 'odd'
		getSlices(sliceCode = 'all') {
			return this.DOM.slices[sliceCode];
		}
		toggleGlitch(action = 'start') {
			for (const gfx of this.gfxArr) {
				gfx[action === 'start' ? 'glitch' : 'stop']();
			}
		}
        switchImages(imgEven, imgOdd, animated = false) {
            if ( animated ) {
				// start the glitchFx.
				this.toggleGlitch();
				
				setTimeout(() => {
					// fade out the slides container.
					this.DOM.el.classList.add('slices--animateOut');
					
					const onTransitionEndFn = () => {
						this.DOM.el.removeEventListener('transitionend', onTransitionEndFn);
						// Change the images for both even and odd slices
						Promise.all([this.setBG(imgEven, 'even'), this.setBG(imgOdd, 'odd')]).then(() => {
							// fade in the slides container.
							this.DOM.el.classList.remove('slices--animateOut');
							// continue the glitchFx for .5 seconds and then stop
							setTimeout(() => this.toggleGlitch('stop'), 500);
						});
					};
					this.DOM.el.addEventListener('transitionend', onTransitionEndFn);
				}, 1000); // start the glitchFx for 1 seconds.
			}
			else {
				this.setBG(imgEven, 'even');
				this.setBG(imgOdd, 'odd');
			}
        }
    };
    
    window.DualImageLayout = DualImageLayout;
};