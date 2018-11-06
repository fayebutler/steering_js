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

  div_int(num) {
    if(num != 0.0) {
      this.x = this.x / num;
      this.y = this.y / num;
    }
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

var attractor;

canvas.addEventListener('click', function(evt) {
  console.log('click');
  var rect = canvas.getBoundingClientRect();
  var attractPos = new Vector((evt.clientX - rect.left), (evt.clientY - rect.top));
  attractor = attractPos;
}, false);

var id = 0;

class Entity {
  constructor(location) {
    this.width = 10;
    this.height = 10;
    this.color = 'black';
    this.id = id++;

    this.location = new Vector(250, 250);
    this.velocity = new Vector(0,0);
    this.acceleration = new Vector(0,0);
    this.maxSpeed = 2;
    this.maxForce = 10;
    this.mass = 1;

    this.wallAvoidanceOn = true;
    this.wanderOn = true;
    this.arriveOn = false;
    this.steerOn = false;
    this.fleeOn = false;
    this.separationOn = true;

    this.wallAvoidanceWeight = 0.6;
    this.wanderWeight = 1;
    this.arriveWeight = 1;
    this.seekWeight = 1;
    this.fleeWeight = 1;
    this.separationWeight = 0.2;

    this.crosshair = new Vector(0,0);
    this.neighbours = []

  }

  update() {
    this.acceleration = this.calculatePrioritizedSum().div_int(this.mass);
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.location.add(this.velocity);
    this.acceleration = new Vector(0,0);
  }

  draw() {
    ctx.fillStyle = 'black';
    ctx.fillRect(this.location.x, this.location.y, this.width, this.height)
  }

  accumulateForce(total, force) {
    var currentMag = total.magnitude();
    var additionalMag = force.magnitude();
    var forceRemaining = this.maxForce - currentMag;
    if(forceRemaining <= 0) {
      return false;
    } else if( additionalMag > forceRemaining ){
      return false;
    } else {
      return true;
    }

  }

  calculatePrioritizedSum() {
    //need to be able to switch on/off behaviours and set weights
    var totalSteeringForce = new Vector(0,0);

    if(this.wallAvoidanceOn) {
      var steer = this.wallAvoidance().mult_int(this.wallAvoidanceWeight);
      if( this.accumulateForce(totalSteeringForce, steer) ) {
        totalSteeringForce.add(steer);
      } else {
        return totalSteeringForce;
      }
    }

    if(this.separationOn) {
      var steer = this.separation(this.neighbours).mult_int(this.separationWeight);
      if( this.accumulateForce(totalSteeringForce, steer) ) {
        totalSteeringForce.add(steer);
      } else {
        return totalSteeringForce;
      }
    }

    if(this.arriveOn) {
      var steer = this.arrive(this.crosshair).mult_int(this.arriveWeight);
      if( this.accumulateForce(totalSteeringForce, steer) ) {
        totalSteeringForce.add(steer);
      } else {
        return totalSteeringForce;
      }
    }

    if(this.seekOn) {
      var steer = this.seek(this.crosshair).mult_int(this.seekWeight);
      if( this.accumulateForce(totalSteeringForce, steer) ) {
        totalSteeringForce.add(steer);
      } else {
        return totalSteeringForce;
      }
    }

    if(this.fleeOn) {
      var steer = this.flee(this.crosshair).mult_int(this.fleeWeight);
      if( this.accumulateForce(totalSteeringForce, steer) ) {
        totalSteeringForce.add(steer);
      } else {
        return totalSteeringForce;
      }
    }

    if(this.wanderOn) {
      var steer = this.wander().mult_int(this.wanderWeight);
      if( this.accumulateForce(totalSteeringForce, steer) ) {
        totalSteeringForce.add(steer);
      } else {
        return totalSteeringForce;
      }
    }

    return totalSteeringForce;

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
    const r = 1;
    const dist = 0.2
    this.heading = new Vector(this.velocity.x, this.velocity.y);
    const a = Math.random() * ((2*Math.PI) - 0) + 0;
    this.heading.normalise();
    const c_origin = this.heading.mult_int(dist);
    const x = c_origin.x + r * Math.cos(a);
    const y = c_origin.y + r * Math.sin(a);

    var steer = new Vector(x, y).add(this.heading);
    return steer
  }

  wallAvoidance() {
    // I need to sort this out a bit more
    // should have a data structure that holds where the walls are and run against that

      const detectionRad = 20;
      // should addin 2 more feelers 45 degrees left/right from front feeler then do a loop over the code for each feeler
      var frontFeeler = new Vector(this.location.x + (this.velocity.x * detectionRad), this.location.y + (this.velocity.y * detectionRad));

      // var pixel = ctx.getImageData(x, y, 1, 1);
      // var data = pixel.data;
      // var rgba = 'rgba(' + data[0] + ', ' + data[1] +
      //            ', ' + data[2] + ', ' + (data[3] / 255) + ')';

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
      // steer.limit(this.maxForce);
      return steer;
  }

  separation( neighbours ) {
    var steer = new Vector(0, 0);

    for(var i=0; i<neighbours.length; i++) {
      var neighbour = neighbours[i];
      var vectorToNeighbour = new Vector((neighbour.location.x - this.location.x), (neighbour.location.y - this.location.y));
      var steer = new Vector(0, 0);
      vectorToNeighbour.normalise();
      vectorToNeighbour.div_int(-(vectorToNeighbour.magnitude()));
      steer.add(vectorToNeighbour);
    }
    return steer;
  }

}

const num_entities = 5;
var entities = [];
for(var i=0; i<num_entities; i++) {
  entities.push(new Entity());
}

function update() {
  // console.log('mouse pos ', currentMousePos)
  if (attractor) {
    entities.forEach(function(entity) {
      entity.arriveOn = true;
      entity.crosshair = attractor;
    });
  }
  entities.forEach(function(entity, index) {
    //remove current entity
    var removed = entities.filter(function(x, n) {
      if(n != index) {
        return x;
      }
    })
    entity.neighbours = removed;
    entity.update();
  });
  draw();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (attractor) {
    ctx.fillStyle = 'orange';
    ctx.fillRect(attractor.x, attractor.y, 5, 5);
  }
  entities.forEach(function(entity) {
    entity.draw();
  });
}

update();



window.setInterval(update, 100);
