class Vector {
  constructor(x,y) {
    this.x = x;
    this.y = y;
  }

  update(x,y) {
    this.x = x;
    this.y = y;
    return this;
  }

  sub(vec) {
    this.x -= vec.x;
    this.y -= vec.y;
    return this;
  }

  add(vec) {
    this.x += vec.x;
    this.y += vec.y;
    return this;
  }

  mult_int(num) {
    this.x = this.x * num;
    this.y = this.y * num;
    return this;
  }

  magnitude() {
    return Math.sqrt((this.x * this.x) + (this.y * this.y));
  }

  limit(num) {
    let magnitude = this.magnitude();
    if(magnitude > num) {
      this.normalise();
      this.mult_int(num);
    }
    return this;
  }

  normalise() {
    let magnitude = this.magnitude();
    if(magnitude > 0.0) {
      this.x = this.x / magnitude;
      this.y = this.y / magnitude;
    }
    return this;
  }
}


var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

currentMousePos = new Vector(0,0);

function getMousePos(canvas, evt) {
  // console.log('update mouse pos');
  var rect = canvas.getBoundingClientRect();
  currentMousePos.update((evt.clientX - rect.left), (evt.clientY - rect.top))
}


canvas.addEventListener('mousemove', function(evt) {
  var mousePos = getMousePos(canvas, evt);
}, false);

class Entity {
  constructor() {
    this.width = 10;
    this.height = 10;
    this.color = 'black';

    this.location = new Vector(250,250);
    this.velocity = new Vector(0,0);
    this.acceleration = new Vector(0,0);
    this.maxSpeed = 1;
    this.maxForce = 0.1;

  }

  update() {
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    // console.log('speed ', this.velocity.magnitude());
    this.location.add(this.velocity);
    // console.log('location ', this.location);
    this.acceleration = new Vector(0,0);
  }

  draw() {
    ctx.fillRect(this.location.x, this.location.y, this.width, this.height)
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  accumulateForce(total, force) {

  }

  calculatePrioritizedSum() {
    //need to be able to switch on/off behaviours and set weights
    var totalSteeringForce = new Vector(0,0);

  }

  seek(target) {
    let desired = new Vector(target.x, target.y).sub(this.location);
    desired.normalise();
    desired.mult_int(this.maxSpeed);
    let steer = desired.sub(this.velocity);

    steer.limit(this.maxForce);

    this.applyForce(steer);
  }

  flee(target) {
    let desired = new Vector(this.velocity.x, this.velocity.y).sub(target);
    desired.normalise();
    desired.mult_int(this.maxSpeed);
    let steer = desired.sub(this.velocity);

    steer.limit(this.maxForce);

    this.applyForce(steer);
  }

  arrive(target) {
    let desired = new Vector(target.x, target.y).sub(this.location);

    let dist = desired.magnitude();
    desired.normalise();

    if (dist > 0.1) {

      var m = (dist /100) * this.maxSpeed;
      desired.mult_int(m);
      let steer = desired.sub(this.velocity);
      steer.limit(this.maxForce);

      return steer;

    } else {
      return new Vector(0, 0);
    }

  }

  wander() {
    //create a circle of radius r
    // find random point on circle
    // head to towards that point
    //this.velocity //current heading
    const r = 50;
    this.heading = new Vector(this.velocity.x, this.velocity.y);
    const a = Math.random() * ((2*Math.PI) - 0) + 0;
    this.heading.normalise();
    const c_origin = this.heading.mult_int(0.2);
    const x = c_origin.x + r * Math.cos(a);
    const y = c_origin.y + r * Math.sin(a);

    var steer = new Vector(x, y).add(this.heading);
    steer.limit(this.maxForce);

    this.applyForce(steer);
  }

  wallAvoidance() {
      const detectionRad = 200;
      // should addin 2 more feelers 45 degrees left/right from front feeler then do a loop over the code for each feeler
      var frontFeeler = new Vector(this.location.x + (this.velocity.x * detectionRad), this.location.y + (this.velocity.y * detectionRad));

      console.log('feeler ', frontFeeler);
      var steer = new Vector(this.velocity.x, this.velocity.y);
      if(frontFeeler.x >= 500) {
          // gone out side so turn it around
          steer.x = -this.velocity.x;
      } else if(frontFeeler.x <= 0) {
          steer.x = -this.velocity.x;
      }
      if(frontFeeler.y >= 500) {
          steer.y = -this.velocity.y;
      } else if(frontFeeler.y <= 0) {
          steer.y = -this.velocity.y;
      }
      steer.limit(this.maxForce);
      console.log('steer ', steer);
      this.applyForce(steer);
  }
}

let entity1 = new Entity();
entity1.draw();

function update() {
  // console.log('mouse pos ', currentMousePos)
  entity1.update();
  // entity1.seek(new Vector(500, 500));
  entity1.wallAvoidance();
  draw();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  entity1.draw();
}

update();



window.setInterval(update, 100);
