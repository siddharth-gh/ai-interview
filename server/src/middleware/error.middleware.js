const errorHandler = (err, req, res, next) => {
    console.error(err.message);

    res.status(res.statusCode === 200 ? 500 : res.statusCode).json({
        message: err.message,
    });
};

export default errorHandler;

// not using currently