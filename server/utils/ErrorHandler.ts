class ErrorHandler extends Error {
    statusCode: Number;

    constructor(message:any, statusCode:Number) {
        //The super method is used to call the contructor of the parent class. It passes the message argument to the Error class constructor, which sets the error message for the instance.
        super(message);
        this.statusCode = statusCode;

        Error.captureStackTrace(this, this.constructor);

    }
}

export default ErrorHandler;