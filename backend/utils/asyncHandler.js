// Lets controllers be async without a try/catch in each one.
export default (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
