const userService = require("../service/user-service");
const { validationResult } = require("express-validator");
const ApiError = require("../exceptions/api-error");
const userModel = require("../models/user-model");

class UserController {
  async registration(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(
          ApiError.BadRequest("Помилка при валідації", errors.array())
        );
      }
      const { email, password } = req.body;
      const userData = await userService.registration(email, password);
      res.cookie("refreshToken", userData.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      });
      return res.json(userData);
    } catch (e) {
      next(e);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const userData = await userService.login(email, password);
      res.cookie("refreshToken", userData.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      });
      return res.json(userData);
    } catch (e) {
      next(e);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.cookies;
      const token = await userService.logout(refreshToken);
      res.clearCookie("refreshToken");
      return res.json(token);
    } catch (e) {
      next(e);
    }
  }

  async activate(req, res, next) {
    try {
      const activationLink = req.params.link;
      await userService.activate(activationLink);
      return res.redirect(process.env.CLIENT_URL);
    } catch (e) {
      next(e);
    }
  }
  async changePassRequest(req, res, next) {
    try {
      let { email } = req.body;
      let resertInfo = await userService.changePassRequest(email);
      return res.json(resertInfo);

      // return res.redirect(
      //   `${process.env.CLIENT_URL}/user/changePasswordPage/:${resetLink}`
      // );
    } catch (e) {
      next(e);
    }
  }

  async changePassCallback(req, res, next) {
    try {
      const resetToken = req.params.link;
      if (!resetToken) {
        return res.redirect(`${process.env.CLIENT_URL}`);
      }

      let userCandidate = await userModel.findOne({
        resetToken: resetToken,
        // resetTokenExp: { $gt: Date.now() },
      });

      console.log(userCandidate);
      if (!userCandidate) {
        return res.redirect(`${process.env.CLIENT_URL}`);
      }

      if (userCandidate.resetTokenExp > Date.now()) {
        return res.redirect(`${process.env.CLIENT_URL}`);
      }

      return res.redirect(
        `${process.env.CLIENT_URL}/changePassword.html?reset=${resetToken}`
      );
    } catch (e) {
      next(e);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { resetToken, password } = req.body;
      if (!resetToken) {
        return res.redirect(`${process.env.CLIENT_URL}`);
      }

      let changeStaus = await userService.changePassword(resetToken, password);

      return res.json(changeStaus);
    } catch (e) {
      next(e);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const userData = await userService.refresh(refreshToken);
      return res.json(userData);
    } catch (e) {
      next(e);
    }
  }

  async getUsers(req, res, next) {
    try {
      const users = await userService.getAllUsers();
      return res.json(users);
    } catch (e) {
      next(e);
    }
  }

  async getUser(req, res, next) {
    try {
      const user = await userService.getUser(req);
      return res.json(user);
    } catch (e) {
      next(e);
    }
  }

  async getUsersMoney(req, res, next) {
    try {
      const userMoney = await userService.getUsersMoney(req);
      return res.json(userMoney);
    } catch (e) {
      next(e);
    }
  }

  async topUpUsersMoney(req, res, next) {
    try {
      const userMoney = await userService.topupUsersMoney(req);
      return res.json(userMoney);
    } catch (e) {
      next(e);
    }
  }
  async buyWithBonuses(req, res, next) {
    try {
      const userMoney = await userService.buyWithBonuses(req);
      if (userMoney < 0) {
        return res.status(400).json("недостатньо коштів");
      }
      return res.json(userMoney);
    } catch (e) {
      next(e);
    }
  }
  async getLastOrder(req, res, next) {
    try {
      const { LocalUserID } = req.body;
      let token = req.headers.authorization;

      let lastOrder = await userService.getLastOrder(token, LocalUserID);
      if (!lastOrder) {
        throw ApiError.BadRequest("Замовлення не знайдено");
      }

      return res.json(lastOrder);
    } catch (e) {
      next(e);
    }
  }

  async createUserLocalId(req, res, next) {
    try {
      let userId = await userService.createUserLocalId();
      return res.json(userId);
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new UserController();
