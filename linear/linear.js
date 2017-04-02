//Symbols for private vars
const MODE = Symbol(),
      ROW_LENGTH = Symbol(),
      NUM_DIMENSIONS = Symbol();

// Polyfills
Number.isInteger = Number.isInteger || function(value) {
  return typeof value === 'number' &&
    isFinite(value) &&
    Math.floor(value) === value;
};

class Matrix {
    constructor() {
        this.self = [];
        this.argStack = [...arguments];
        this[ROW_LENGTH] = this.argStack.shift();
        this[NUM_DIMENSIONS] = 1;

        for (let i = 0; i < this[ROW_LENGTH]; i++) {
            this.self.push(0); // Create a 0 matrix of the innermost dimension
        }

        while (this.argStack.length) {
            this.self = this.extendMatrix(this.self, this.argStack.shift()); // Extend the matrix into all dimensions
            this[NUM_DIMENSIONS]++;
        }
    }

    // extend the matrix into the other dimensions
    extendMatrix(matrix, size) {
        // Private-ish maybe use Symbol() here
        let newMatrix = [];

        for (let i = 0; i < size; i++) {
            newMatrix.push(matrix.slice());
        }
        return newMatrix
    }

    recurse(matrix, callback) {
        // This function expects matrix to be an array
        callback = callback || function(x){return x};
        let mx = matrix.slice();

        if (matrix[0] instanceof Array) {
            for (let i = 0; i < matrix.length; i++) {
                mx[i] = this.recurse(matrix[i], callback);
            }
        } else {
            return matrix.map(callback);
        }
        return mx;
    }

    jointRecurse(matrix1, matrix2, callback) {
        // This function expects matrix to be an array
        let retVal = [],
            mx = matrix1.slice(0);

        if (matrix1[0] instanceof Array && matrix2[0] instanceof Array) {
            for (let i = 0; i < matrix1.length; i++) {
                mx[i] = this.jointRecurse(matrix1[i], matrix2[i], callback);
            }
        } else {
            if (matrix1.length !== matrix2.length) throw new Error('Matrix mis-match: The matrices must be of the same size in order to operate jointly on them.'); // use error codes so we can override the messages in subclasses
            for (let i = 0; i < matrix1.length; i++) {
                retVal.push(callback(matrix1[i], matrix2[i]));
            }
            return retVal;
        }
        return mx;
    }

    // Utility
    scale(scalar) {
        // multiply every member by a scalar
        return this.recurse(this.self, function(element){return element * scalar});
    }

    add(matrix) {
        // add one matrix to another
        if (!(matrix instanceof Matrix)) throw new Error('Type error: add(Matrix) expects its argument to be an instance of Matrix.');
        if (this.length !== matrix.length) throw new Error('Matrix mis-match: The matrices must be of the same size in order to add them.');
        let m = matrix.self;
        return this.jointRecurse(this.self, m, function(a, b) {return a + b;});
    }

    subtract(matrix) {
        // subtract one matrix from another
        return this.jointRecurse(this.self, matrix, function(a, b) {return a - b;});
    }

    multiply(matrix) {
        // multiply two matrices
        // Determine if the two matrices are 2D, compatible,
        if (matrix.col[NUM_DIMENSIONS] !== this[ROW_LENGTH]) throw new Error('Matrix mis-match: The matrix being multiplied must be ' + matrix.col[NUM_DIMENSIONS] + ' wide');
        // Create a recursive function to loop through the elements in the new matrix and then through the other matrices accordingly

        // This currently returns the diagonal matrix of the product matrix.
        var result = new Matrix(matrix[ROW_LENGTH], this.col[NUM_DIMENSIONS]);

        for (let i = 0; i < this[ROW_LENGTH]; i++) {
            for (let j = 0; j < this.col[NUM_DIMENSIONS]; j ++) {
                for (let  k = 0; k < matrix[ROW_LENGTH]; k ++) {
                    result.self[k][j] += matrix.self[i][j] * this.self[k][i];
                }
            }
        }
        return result;
    }

    transform(matrix) {
        //
    }

    getDeterminant() {
        //
    }

    getTrace() {
        // validate that the matrix is 2D and square
        if (!this.self[0][0] || this.self[0][0][0]) throw new Error('Matrix mis-match: The matrix must be a 2D matrix to find the trace.');
        if (this.self.length !== this.self[0].length) throw new Error('Matrix mis-match: The matrix must have the same length as width to find the trace.');
        // return the trace of an n by n matrix
        return this.self.map(function(mat, i) {return mat[i];}).reduce(function(a, b) {return a + b;});
    }

    getCharacteristicPolynomial() {
        //
    }

    getMinimalPolynomial() {
        //
    }

    getEigenValues() {
        // return an array of eigen values
    }

    getEigenVector() {
        // return the eigen vector
    }

    print() {
        // display the matrix as a string
        let result = JSON.stringify(this.self).replace(/\],\[/g, '\],\n\[');
        console.log(result);
        return result;
    }
}

// Vector should extend Matrix as implementing Matrix as an extension of Vector seems more difficult
class Vector extends Matrix {
    constructor(dimensions, mode) {
        if (!Number.isInteger(dimensions)) throw new Error('Invalid dimension: Please enter a positive integer representing the dimensionality of the vector.');
        super(dimensions);
        this[MODE] = (mode && mode.toUpperCase() === 'RAD')? 'RAD': 'DEG';
    }

    // Utility
    radToDeg(value) {
        // convert to degrees
        return value * 180 / Math.PI;
    }
    degToRad(value){
        // convert to radians
        return value * Math.PI / 180;
    }

    isColinear(vector) {
        // determine whether two vectors are co-linear or not
        return (this.dotProduct(vector) === this.getMagnitude() * vector.getMagnitude());
    }

    // Operations
    dotProduct(matrix) {
        // find the dot product of two vectors
        if (!(matrix instanceof Matrix) && !(matrix instanceof Vector)) throw new Error('Type error: dotProduct(Matrix) expects its argument to be an instance of Matrix or Vector.');
        let m = matrix.self;
        return this.jointRecurse(this.self, m, function(a, b){return a * b;}).reduce(function(a, b){return a + b;});
    }
    crossProduct(matrix) {
        // find the cross product of two vectors
        if (!(matrix instanceof Matrix) && !(matrix instanceof Vector)) throw new Error('Type error: dotProduct(Matrix) expects its argument to be an instance of Matrix or Vector.');
        return this.getMagnitude() * matrix.getMagnitude() * Math.sin(this.getAngle(matrix));
    }

    // Getters
    getMagnitude() {
        // get the length of the vector
        return Math.sqrt(this.dotProduct(this));
    }

    getAngle(vector) {
        // return the angle between the two vectors
        if (!(vector instanceof Vector)) throw new Error('Type error: getAngle(Vector) expects its argument to be an instance of Vector.');

        if (this[MODE] === 'DEG') {
            return this.radToDeg(Math.acos(this.dotProduct(vector) / (this.getMagnitude() * vector.getMagnitude())));
        } else if (this[MODE] === 'RAD') {
            return Math.acos(this.dotProduct(vector) / (this.getMagnitude() * vector.getMagnitude()));
        }
    }

    getUnitVector() {
        // return this vector with a magnitude of one
        let magnitude = this.getMagnitude();
        return this.recurse(this.self, function(a) {return a / magnitude;});
    }

    getCoordinates() {
        // get the vector's Coordinates
        return this.self;
    }

    getZeroVector() {
        // return the zero vector in this space
        return new Vector(this[NUM_DIMENSIONS]);
    }

    // Setters
    setMode(mode) {
        this[MODE] = (mode && mode.toUpperCase() === 'RAD')? 'RAD': 'DEG';
    }
}

class Point extends Vector {
    constructor() {
        super(arguments.length);
        for (let i = 0; i < arguments.length; i++) {
            this.self[i] = arguments[i];
        }
    }
}

class Segment {
    constructor(a, b) {
        if (!(a instanceof Point) || !(b instanceof Point)) throw new Error('Type Error: Segment accepts two points.');
        this.a = a;
        this.b = b;
    }
}
