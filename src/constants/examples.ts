import { Simulation } from '../types';

export const FEATURED_SIMULATIONS: Simulation[] = [
  {
    id: 'example-particle-system',
    concept: 'Autonomous Particle System',
    explanation: 'A particle system simulating autonomous agents moving in a 2D space. Lines are drawn between nearby particles to visualize proximity and network connectivity, creating a dynamic web-like structure.',
    code: `
      var particles = [];
      var numParticles = 200;
      var maxSpeed = 2;
      var particleSize = 4;
      var connectionDist = 100;
      var bgColor = 10;

      // @control Slider(50, 500, 200) var numParticles = 200;
      // @control Slider(1, 10, 2) var maxSpeed = 2;
      // @control Slider(2, 20, 4) var particleSize = 4;
      // @control Slider(50, 200, 100) var connectionDist = 100;

      function setup() {
        createCanvas(windowWidth, windowHeight);
        for (let i = 0; i < 500; i++) {
          particles.push(new Particle());
        }
        
        window.addEventListener('message', (event) => {
          if (event.data.type === 'UPDATE_VARIABLE') {
            window[event.data.name] = event.data.value;
          }
        });
      }

      function draw() {
        background(bgColor);
        
        let currentParticles = particles.slice(0, numParticles);
        
        for (let i = 0; i < currentParticles.length; i++) {
          currentParticles[i].update();
          currentParticles[i].draw();
          
          for (let j = i + 1; j < currentParticles.length; j++) {
            let d = dist(currentParticles[i].x, currentParticles[i].y, currentParticles[j].x, currentParticles[j].y);
            if (d < connectionDist) {
              stroke(100, 150, 255, map(d, 0, connectionDist, 100, 0));
              line(currentParticles[i].x, currentParticles[i].y, currentParticles[j].x, currentParticles[j].y);
            }
          }
        }
      }

      class Particle {
        constructor() {
          this.x = random(width);
          this.y = random(height);
          this.vx = random(-1, 1);
          this.vy = random(-1, 1);
        }
        
        update() {
          this.x += this.vx * maxSpeed;
          this.y += this.vy * maxSpeed;
          
          if (this.x < 0 || this.x > width) this.vx *= -1;
          if (this.y < 0 || this.y > height) this.vy *= -1;
        }
        
        draw() {
          noStroke();
          fill(200, 220, 255);
          circle(this.x, this.y, particleSize);
        }
      }

      function windowResized() {
        resizeCanvas(windowWidth, windowHeight);
      }
    `,
    controls: [
      { name: 'numParticles', min: 50, max: 500, default: 200, value: 200 },
      { name: 'maxSpeed', min: 1, max: 10, default: 2, value: 2 },
      { name: 'particleSize', min: 2, max: 20, default: 4, value: 4 },
      { name: 'connectionDist', min: 50, max: 200, default: 100, value: 100 }
    ]
  },
  {
    id: 'example-fractal-tree',
    concept: 'Recursive Fractal Tree',
    explanation: 'A fractal tree demonstration using recursive functions. Each branch splits into two smaller branches at a defined angle, illustrating how simple mathematical rules can regenerate complex patterns found in nature.',
    code: `
      var angle = 0.52;
      var lengthFactor = 0.67;
      var initialLength = 150;
      var minLength = 4;
      var strokeWidth = 2;

      // @control Slider(0, 1.57, 0.52) var angle = 0.52;
      // @control Slider(0.5, 0.8, 0.67) var lengthFactor = 0.67;
      // @control Slider(50, 300, 150) var initialLength = 150;
      // @control Slider(1, 10, 2) var strokeWidth = 2;

      function setup() {
        createCanvas(windowWidth, windowHeight);
        
        window.addEventListener('message', (event) => {
          if (event.data.type === 'UPDATE_VARIABLE') {
            window[event.data.name] = event.data.value;
          }
        });
      }

      function draw() {
        background(15);
        stroke(255);
        strokeWeight(strokeWidth);
        translate(width / 2, height);
        branch(initialLength);
      }

      function branch(len) {
        line(0, 0, 0, -len);
        translate(0, -len);
        if (len > minLength) {
          push();
          rotate(angle);
          branch(len * lengthFactor);
          pop();
          push();
          rotate(-angle);
          branch(len * lengthFactor);
          pop();
        }
      }

      function windowResized() {
        resizeCanvas(windowWidth, windowHeight);
      }
    `,
    controls: [
      { name: 'angle', min: 0, max: 1.57, default: 0.52, value: 0.52 },
      { name: 'lengthFactor', min: 0.5, max: 0.8, default: 0.67, value: 0.67 },
      { name: 'initialLength', min: 50, max: 300, default: 150, value: 150 },
      { name: 'strokeWidth', min: 1, max: 10, default: 2, value: 2 }
    ]
  },
  {
    id: 'example-wave-interference',
    concept: 'Double Slit Interference',
    explanation: 'A visualization of wave interference patterns, similar to the ripple patterns seen from two point sources. It demonstrates constructive and destructive interference as waves overlap in space.',
    code: `
      var freq = 0.05;
      var waveSpeed = 0.1;
      var slitDist = 50;
      var intensity = 150;

      // @control Slider(0.01, 0.2, 0.05) var freq = 0.05;
      // @control Slider(0.01, 0.5, 0.1) var waveSpeed = 0.1;
      // @control Slider(10, 200, 50) var slitDist = 50;
      // @control Slider(50, 255, 150) var intensity = 150;

      function setup() {
        createCanvas(windowWidth, windowHeight);
        pixelDensity(1);
        
        window.addEventListener('message', (event) => {
          if (event.data.type === 'UPDATE_VARIABLE') {
            window[event.data.name] = event.data.value;
          }
        });
      }

      function draw() {
        loadPixels();
        let time = millis() * waveSpeed;
        
        for (let y = 0; y < height; y += 4) {
          for (let x = 0; x < width; x += 4) {
            let d1 = dist(x, y, width/4, height/2 - slitDist/2);
            let d2 = dist(x, y, width/4, height/2 + slitDist/2);
            
            let val1 = sin(d1 * freq - time);
            let val2 = sin(d2 * freq - time);
            
            let finalVal = (val1 + val2) * intensity;
            
            fill(map(finalVal, -2*intensity, 2*intensity, 0, 255), 100, 255);
            noStroke();
            rect(x, y, 4, 4);
          }
        }
      }

      function windowResized() {
        resizeCanvas(windowWidth, windowHeight);
      }
    `,
    controls: [
      { name: 'freq', min: 0.01, max: 0.2, default: 0.05, value: 0.05 },
      { name: 'waveSpeed', min: 0.01, max: 0.5, default: 0.1, value: 0.1 },
      { name: 'slitDist', min: 10, max: 200, default: 50, value: 50 },
      { name: 'intensity', min: 50, max: 255, default: 150, value: 150 }
    ]
  }
];
