const ApiError = require("../exceptions/api-error");
const fortuneService = require("../service/fortune-service");

class CartControler {
  async play(req, res, next) {
    try {
      const { level } = req.body;
      let response = await fortuneService.play(
        level,
        req.headers.authorization
      );
      return res.json(response);
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new CartControler();
